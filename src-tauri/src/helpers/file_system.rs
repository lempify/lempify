use shared::dirs::get_config;
use users::get_user_by_name;

use std::fs;
use std::os::unix::fs::chown;
use std::os::unix::fs::PermissionsExt;
use std::path::Path;
/**
 * File system helpers
 */
use std::path::PathBuf;
use std::os::unix::fs::MetadataExt;
use std::process::Stdio;
use std::process::Command;
use std::io::Write;

use users::User;

pub fn get_lempify_dir_name() -> &'static str {
    if cfg!(target_os = "macos") {
        "Lempify"
    } else {
        "lempify"
    }
}

/**
 * Get the Lempify dir path i.e. `~/.config/Lempify` or `~/Library/Application Support/Lempify`
 */
pub fn get_lempify_dir() -> Result<PathBuf, String> {
    let config_dir = get_config()?;
    let config_dir = config_dir.join(get_lempify_dir_name());
    Ok(config_dir)
}

/**
 * Get a directory in the config dir
 */
pub fn get_config_dir(dir: &str) -> Result<PathBuf, String> {
    let config_dir = get_lempify_dir()?;
    let config_dir = config_dir.join(dir);
    Ok(config_dir)
}

/**
 * Get the sites directory i.e. `~/.config/Lempify/sites` or `~/Library/Application Support/Lempify/sites`
 */
pub fn get_sites_dir() -> Result<PathBuf, String> {
    get_config_dir("sites")
}

/**
 * Get the nginx directory i.e. `~/.config/Lempify/nginx` or `~/Library/Application Support/Lempify/nginx`
 */
pub fn get_nginx_dir() -> Result<PathBuf, String> {
    get_config_dir("nginx")
}

/**
 * Get the certs directory i.e. `~/.config/Lempify/certs` or `~/Library/Application Support/Lempify/certs`
 */
pub fn get_certs_dir() -> Result<PathBuf, String> {
    get_config_dir("certs")
}

/**
 * Load JSON config file i.e. `~/.config/Lempify/config.json` or `~/Library/Application Support/Lempify/config.json`
 */
pub fn load_json() -> Result<String, String> {
    let config_path = get_config_dir("config.json")?;

    let config = if !config_path.exists() {
        fs::write(config_path, "{\"test\": \"test\"}").map_err(|e| e.to_string())?;
        "{\"test\": \"test\"}".to_string()
    } else {
        fs::read_to_string(config_path).map_err(|e| e.to_string())?
    };

    Ok(config)
}

// Conditional helpers

/**
 * Does directory exist?
 */
pub fn dir_exists(dir: &str) -> Result<bool, String> {
    let path = get_config_dir(dir)?;
    Ok(path.exists())
}

/// File System struct

pub struct FileSystem {
    pub config_dir: PathBuf,
    pub sites_dir: PathBuf,
    pub nginx_dir: PathBuf,
    pub certs_dir: PathBuf,
}

impl FileSystem {
    pub fn new() -> Result<Self, String> {
        let config_dir = get_lempify_dir()?;
        let sites_dir = config_dir.join("sites");
        let nginx_dir = config_dir.join("nginx");
        let certs_dir = config_dir.join("certs");
        Ok(Self {
            config_dir,
            sites_dir,
            nginx_dir,
            certs_dir,
        })
    }

    #[allow(dead_code)]
    pub fn is_dir(&self, path: &Path) -> bool {
        path.is_dir()
    }

    pub fn is_file(&self, path: &Path) -> bool {
        path.is_file()
    }
    // /Users/jaredrethman/Personal/lempify/testical
    pub fn mkdir(&self, path: &Path, owner: &User, mode: u32) -> Result<(), String> {
        // Create directory with sudo
        let output = Command::new("sudo")
            .args(["-S", "mkdir", "-p", path.to_str().unwrap()])
            //.output()
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn();

        // if !output.status.success() {
        //     return Err(String::from_utf8_lossy(&output.stderr).to_string());
        // }

        // Set permissions with sudo
        let output = Command::new("sudo")
            .args(["-S", "chmod", &format!("{:o}", mode), path.to_str().unwrap()])
            //.output()
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn();

        // if !output.status.success() {
        //     return Err(String::from_utf8_lossy(&output.stderr).to_string());
        // }

        // Change ownership with sudo
        let output = Command::new("sudo")
            .args(["-S", "chown", &owner.uid().to_string(), path.to_str().unwrap()])
            //.output()
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn();

            // if !output.status.success() {
            //     return Err(String::from_utf8_lossy(&output.stderr).to_string());
            // }

        // let status = child.wait()?;
        // Ok(status.success())
        Ok(())
    }

    // pub fn ensure_dir_exists(&self, path: &Path) -> Result<(), String> {
    //     if !self.is_dir(path)? {
    //         self.mkdir(path, &user::get_current()?, 0o755)?;
    //     }
    //     Ok(())
    // }
}

pub fn call_me_maybe() -> Result<(), String> {
    let file_system = FileSystem::new().unwrap();
    // //println!("Config Dir:{:?}", file_system.config_dir);
    // //println!("Sites Dir:{:?}", file_system.sites_dir);
    // //println!("Nginx Dir:{:?}", file_system.nginx_dir);
    // //println!("Certs Dir:{:?}", file_system.certs_dir);
    // //println!(
    //     "Is Path:{:?}",
    //     file_system.is_dir(&file_system.certs_dir.as_path())
    // );
    // //println!(
    //     "Is File:{:?}",
    //     file_system.is_file(&file_system.certs_dir.as_path())
    // );
    let root_user = get_user_by_name("root").unwrap();
    //println!("Root User: {:#?}", root_user);
    let new_dir = file_system.mkdir(
        Path::new("/tmp/lempify_test"),
        &root_user,
        0o755,
    );
    //println!("New Dir: {:?}", new_dir);

    // Check permissions
    let metadata = std::fs::metadata("/tmp/lempify_test");
    // //println!("Directory permissions: {:o}", metadata.permissions().mode());
    // //println!("Directory owner: {}", metadata.uid());

    Ok(())
}
