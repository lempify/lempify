use mysql::{Pool, PooledConn};
use once_cell::sync::Lazy;
use regex::Regex;
use std::{fs, io, path::PathBuf};

use crate::{
    helpers::service_utils::{get_brew_formula, get_version_args},
    models::{
        service::{ServiceStatus, ServiceType},
    },
};
use shared::brew;

/**
 * This regex is used to extract the version from the service output.
 * It matches the version in the following formats:
 * - PHP 8.4.24
 * - Ver 1.23.0
 * - nginx/1.23.0
 */
static VERSION_REGEX: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"(?m)(?:PHP\s+|Ver\s+|nginx/)(?P<version>\d+(?:\.\d+)*)").expect("invalid regex")
});

fn extract_version(input: &str) -> Option<String> {
    VERSION_REGEX
        .captures(input)
        .and_then(|caps| caps.name("version").map(|m| m.as_str().to_owned()))
}

pub async fn get_service_status(service: ServiceType) -> ServiceStatus {
    let bin = get_brew_formula(&service);
    let installed = brew::is_service_installed(bin);
    let version = if installed {
        let (args, use_stderr) = get_version_args(&service);
        brew::get_binary_version(bin, args, use_stderr).ok()
    } else {
        None
    };

    ServiceStatus {
        name: bin.to_string(),
        running: brew::is_service_running(bin),
        version: version
            .as_deref()
            .and_then(extract_version)
            .or_else(|| Some("".to_string())),
        installed,
    }
}

pub async fn restart_service(service: ServiceType) -> Result<ServiceStatus, String> {
    let formula = get_brew_formula(&service);
    brew::stop_service(formula)?;
    brew::start_service(formula)?;
    Ok(get_service_status(service).await)
}

pub fn copy_dir_recursive(src: &PathBuf, dest: &PathBuf) -> Result<(), String> {
    if !src.exists() {
        return Err(format!("Source path does not exist: {}", src.display()));
    }

    if src.is_dir() {
        fs::create_dir_all(dest).map_err(|e| format!("Failed to create directory: {}", e))?;
        for entry in fs::read_dir(src).map_err(|e| format!("Failed to read directory: {}", e))? {
            let entry = entry.map_err(|e| format!("Failed to read directory entry: {}", e))?;
            let path = entry.path();
            let file_name = path.file_name().unwrap();
            copy_dir_recursive(&path, &dest.join(file_name))?;
        }
    } else {
        fs::copy(src, dest).map_err(|e| {
            format!(
                "Failed to copy file: {} - {} - {}",
                e,
                src.display(),
                dest.display()
            )
        })?;
    }
    Ok(())
}

pub fn copy_zip_entry_to_path<R: io::Read + io::Seek>(
    file: &mut zip::read::ZipFile<R>,
    outpath: &PathBuf,
) -> Result<(), String> {
    if file.is_dir() {
        fs::create_dir_all(outpath).map_err(|e| format!("Failed to create directory: {}", e))?;
    } else {
        if let Some(p) = outpath.parent() {
            if !p.exists() {
                fs::create_dir_all(p).map_err(|e| format!("Failed to create directory: {}", e))?;
            }
        }
        let mut outfile =
            fs::File::create(outpath).map_err(|e| format!("Failed to create file: {}", e))?;
        io::copy(file, &mut outfile).map_err(|e| format!("Failed to copy file: {}", e))?;
    }
    Ok(())
}

pub fn get_mysql_connection(
    mysql_host: String,
    mysql_user: String,
    mysql_password: String,
    mysql_port: u16,
) -> Result<PooledConn, String> {
    let conn_str = format!(
        "mysql://{}:{}@{}:{}/",
        mysql_user, mysql_password, mysql_host, mysql_port
    );
    let pool =
        Pool::new(conn_str.as_str()).map_err(|e| format!("Failed to connect to MySQL: {}", e))?;

    let conn = pool
        .get_conn()
        .map_err(|e| format!("Failed to get MySQL connection: {}", e))?;

    Ok(conn)
}
