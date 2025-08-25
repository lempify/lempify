use std::{fs, path::PathBuf};

use crate::helpers::utils::copy_dir_recursive;
use shared::file_system::AppFileSystem;
use shared::utils_legacy::FileSudoCommand;

#[derive(Debug)]
struct Stub {
    stub_dir_name: String,
    // src_stub_path: PathBuf,
    // domain: String,
}

impl Stub {
    pub fn new(site_type: &str /* , domain: &str */) -> Result<Self, String> {
        // let app_fs = AppFileSystem::new()?;
        // let src_stub_path = app_fs.app_stubs_dir.join(site_type);
        Ok(Stub {
            // src_stub_path,
            // domain: domain.to_string(),
            stub_dir_name: site_type.to_string(),
        })
    }

    pub fn get_stub_contents(&self) -> Result<Vec<String>, String> {
        let app_fs = AppFileSystem::new()?;
        let src_stub_path = app_fs.app_stubs_dir.join(&self.stub_dir_name);
        let mut stub_contents = Vec::new();
        for entry in fs::read_dir(&src_stub_path)
            .map_err(|e| format!("Failed to read stub: {} / {}", e, src_stub_path.display()))?
        {
            let entry = entry
                .map_err(|e| format!("Failed to read stub: {} / {}", e, src_stub_path.display()))?; // TODO: Handle this error
            stub_contents.push(entry.path().to_string_lossy().to_string());
        }
        Ok(stub_contents)
    }
}

/**
 * Get local stub directory contents.
 */
pub fn create_site_type_stub(site_type: &str, domain: &str, version: &str) -> Result<(), String> {
    let stub = Stub::new(&site_type)?;
    let app_fs = AppFileSystem::new()?;

    // SOURCE
    let src_stub_contents = stub.get_stub_contents()?;

    // DESTINATION
    let dest_site_dir = app_fs.sites_dir.join(domain);

    // 1. Copy all files from source stub to destination site directory.
    // 2. Perform site-type specific actions.
    //  2.1 If WordPress, symlink all files/folders from `site-types/wordpress/{version}` except `wp-content` to the site directory.

    // #1
    for src_stub_content in src_stub_contents.iter() {
        let src_path = PathBuf::from(src_stub_content);
        let file_name = src_path.file_name().unwrap();
        let destination_path = dest_site_dir.join(file_name);
        copy_dir_recursive(&src_path, &destination_path)?;
    }

    // println!("--------------------------------");
    // println!("STUB: {:#?}", stub);
    // println!("\t- Stub contents: {:#?}", stub.get_stub_contents()?);
    // println!("DEST Site dir: {:#?}", dest_site_dir);
    // println!("ARG: Site type: {:#?}", site_type);
    // println!("ARG: Version: {:#?}", version.to_string());
    // println!("--------------------------------");

    // #2, match site type and perform specific actions.
    match site_type {
        "wordpress" => {
            let dest_stub_dir = app_fs.site_types_dir.join(site_type).join(version);

            println!("DEST Stub dir: {:#?}", dest_stub_dir);

            for entry in fs::read_dir(&dest_stub_dir).map_err(|e| {
                format!(
                    "FS: Failed to read site type directory: {} - {}",
                    e,
                    dest_stub_dir.display()
                )
            })? {
                let src_entry = entry
                    .map_err(|e| format!("ENTRY: Failed to read site type directory: {}", e))?;
                let file_path = src_entry.path().to_string_lossy().to_string();
                let file_name = file_path.split("/").last().unwrap();
                if file_name != "wp-content" {
                    let dest_path = dest_site_dir.join(&file_name);
                    let src_path = src_entry.path();
                    if src_path.is_dir() {
                        copy_dir_recursive(&src_path, &dest_path)?;
                    } else {
                        fs::copy(&src_path, &dest_path).map_err(|e| {
                            format!(
                                "Failed to copy file: {} - {} - {}",
                                e,
                                src_path.display(),
                                dest_path.display()
                            )
                        })?;
                    }
                }
            }
        }
        "vanilla" => {
            // Copy all files from `src-tauri/stubs/vanilla` to the site directory.
            let src_stub_dir = app_fs.app_stubs_dir.join(site_type);
            let dest_site_dir = app_fs.sites_dir.join(domain);
            copy_dir_recursive(&src_stub_dir, &dest_site_dir)?;
        }
        _ => {}
    }

    Ok(())
}

pub fn create_nginx_config_stub(domain: &str, php_socket: Option<&str>) -> Result<String, String> {
    let app_fs = AppFileSystem::new()?;

    println!("APP FS: {:#?}", app_fs);

    let stub_template = app_fs
        .app_stubs_dir
        .join("domain_name-domain_tld.nginx.conf");

    let dest_path = AppFileSystem::new()?.nginx_sites_enabled_dir;
    let dest_path = dest_path.join(format!("{}.conf", domain));

    let config_contents = fs::read_to_string(&stub_template)
        .map_err(|e| format!("Failed to read stub: {} / {}", e, stub_template.display()))?;

    let config_contents = config_contents.replace("{{DOMAIN}}", domain).replace(
        "{{PHP_SOCKET}}",
        php_socket.unwrap_or("unix:/opt/homebrew/var/run/php/php-fpm.sock"),
    );

    FileSudoCommand::write(config_contents.to_string(), dest_path.to_path_buf()).run()?;

    Ok(dest_path.display().to_string())
}
