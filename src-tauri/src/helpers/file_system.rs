use shared::dirs::{get_config, get_lempify_app_dir};
// use users::get_user_by_name;

use std::fs;
use std::path::Path;
/**
 * File system helpers
 */
use std::path::PathBuf;
use std::process::Stdio;
use std::process::Command;

use users::User;

pub fn get_app_dir() -> Result<PathBuf, String> {
    let config_dir = get_config()?;
    let app_dir = config_dir.join("Lempify");
    Ok(app_dir)
}

/**
 * Get a directory in the app support dir
 */
pub fn get_config_dir(dir: &str) -> Result<PathBuf, String> {
    let config_dir = get_lempify_app_dir()?;
    let config_dir = config_dir.join(dir);
    Ok(config_dir)
}

/**
 * Load JSON config file i.e. `~/Library/Application Support/Lempify/config.json` or `~/.config/lempify/config.json`
 */
pub fn load_json() -> Result<String, String> {
    let config_path = get_config_dir("config.json")?;

    let config = if !config_path.exists() {
        fs::write(config_path, "{}").map_err(|e| e.to_string())?;
        "{}".to_string()
    } else {
        fs::read_to_string(config_path).map_err(|e| e.to_string())?
    };

    Ok(config)
}

/// File System struct

#[allow(dead_code)]
pub struct AppFileSystem {
    pub dir: PathBuf,
    pub sites_dir: PathBuf,
    pub nginx_dir: PathBuf,
    pub certs_dir: PathBuf,
    pub stubs_dir: PathBuf,
}

#[allow(dead_code)]
impl AppFileSystem {
    pub fn new() -> Result<Self, String> {

        let dir = PathBuf::from(env!("CARGO_MANIFEST_DIR").to_string());

        // Get src-tauri/stubs directory
        let stubs_dir = dir.join("stubs");
        
        // Sites directory - standard web server location
        let sites_dir = if cfg!(target_os = "macos") {
            PathBuf::from("/opt/homebrew/var/www")
        } else {
            PathBuf::from("/var/www")
        };
        
        // Nginx directory - standard system location
        let nginx_dir = if cfg!(target_os = "macos") {
            PathBuf::from("/opt/homebrew/etc/nginx")
        } else {
            PathBuf::from("/etc/nginx")
        };
        
        // Certs directory - standard system location
        let certs_dir = if cfg!(target_os = "macos") {
            PathBuf::from("/opt/homebrew/etc/nginx/ssl")
        } else {
            PathBuf::from("/etc/ssl/certs")
        };
        
        Ok(Self {
            dir,
            sites_dir,
            nginx_dir,
            certs_dir,
            stubs_dir,
        })
    }

    pub fn is_dir(&self, path: &Path) -> bool {
        path.is_dir()
    }

    pub fn is_file(&self, path: &Path) -> bool {
        path.is_file()
    }
    
    pub fn mkdir(&self, path: &Path, owner: &User, mode: u32) -> Result<(), String> {
        // Create directory with sudo
        let _output = Command::new("sudo")
            .args(["-S", "mkdir", "-p", path.to_str().unwrap()])
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn();

        // Set permissions with sudo
        let _output = Command::new("sudo")
            .args(["-S", "chmod", &format!("{:o}", mode), path.to_str().unwrap()])
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn();

        // Change ownership with sudo
        let _output = Command::new("sudo")
            .args(["-S", "chown", &owner.uid().to_string(), path.to_str().unwrap()])
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn();

        Ok(())
    }
}

pub fn init() -> Result<(), String> {
    // let file_system = AppFileSystem::new().unwrap();
    // println!("Config Dir:{:?}", file_system.config_dir);
    // println!("Sites Dir:{:?}", file_system.sites_dir);
    // println!("Nginx Dir:{:?}", file_system.nginx_dir);
    // println!("Certs Dir:{:?}", file_system.certs_dir);
    // println!(
    //     "Is Path:{:?}",
    //     file_system.is_dir(&file_system.certs_dir.as_path())
    // );
    // //println!(
    //     "Is File:{:?}",
    //     file_system.is_file(&file_system.certs_dir.as_path())
    // );
    // let root_user = get_user_by_name("root").unwrap();
    // println!("Root User: {:#?}", root_user);
    // let new_dir = file_system.mkdir(
    //     Path::new("/tmp/lempify_test"),
    //     &root_user,
    //     0o755,
    // );
    // println!("New Dir: {:?}", new_dir);

    // Check permissions
    // let metadata = std::fs::metadata("/tmp/lempify_test");
    // println!("Directory permissions: {:o}", metadata.permissions().mode());
    // println!("Directory owner: {}", metadata.uid());

    Ok(())
}
