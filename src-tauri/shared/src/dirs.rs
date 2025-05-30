use std::{fs, path::PathBuf};

use dirs;

pub fn get_config() -> Result<PathBuf, String> {
    let config_dir = dirs::config_dir().ok_or("Could not get config directory")?;
    Ok(config_dir)
}

pub fn get_home() -> Result<PathBuf, String> {
    let home = dirs::home_dir().ok_or("Could not get home directory")?;
    Ok(home)
}

/**
 * Get the Lempify application support directory
 * ~/Library/Application Support/Lempify (macOS)
 * ~/.config/lempify (Linux)
 */
pub fn get_lempify_app_dir() -> Result<PathBuf, String> {
    let config_dir = get_config()?;
    let app_dir = config_dir.join("Lempify");
    
    if !app_dir.exists() {
        fs::create_dir_all(&app_dir)
            .map_err(|e| format!("Failed to create app directory: {}", e))?;
    }
    
    Ok(app_dir)
}

/**
 * Get a directory in the Lempify application support directory
 */
pub fn get_app_dir(dir: &str) -> Result<PathBuf, String> {
    let app_dir = get_lempify_app_dir()?;
    let dir_path = app_dir.join(dir);

    if !dir_path.exists() {
        fs::create_dir_all(&dir_path)
            .map_err(|e| format!("Failed to create {} dir: {}", dir_path.display(), e))?;
    }

    Ok(dir_path)
}

/**
 * Get the sites directory (standard web server location)
 * /opt/homebrew/var/www (macOS with Homebrew)
 * /var/www (Linux)
 */
pub fn get_sites() -> Result<PathBuf, String> {
    let sites_dir = if cfg!(target_os = "macos") {
        PathBuf::from("/opt/homebrew/var/www")
    } else {
        PathBuf::from("/var/www")
    };
    
    if !sites_dir.exists() {
        fs::create_dir_all(&sites_dir)
            .map_err(|e| format!("Failed to create sites directory: {}", e))?;
    }
    
    Ok(sites_dir)
}

/**
 * Get the nginx directory (standard system location)
 * /opt/homebrew/etc/nginx (macOS with Homebrew)
 * /etc/nginx (Linux)
 */
pub fn get_nginx() -> Result<PathBuf, String> {
    let nginx_dir = if cfg!(target_os = "macos") {
        PathBuf::from("/opt/homebrew/etc/nginx/sites-enabled")
    } else {
        PathBuf::from("/etc/nginx/sites-enabled")
    };
    
    Ok(nginx_dir)
}

/**
 * Get the certs directory (standard system location) 
 * /opt/homebrew/etc/nginx/ssl (macOS with Homebrew)
 * /etc/ssl/certs (Linux)
 */
pub fn get_certs() -> Result<PathBuf, String> {
    let certs_dir = if cfg!(target_os = "macos") {
        PathBuf::from("/opt/homebrew/etc/nginx/ssl")
    } else {
        PathBuf::from("/etc/ssl/certs")
    };
    
    if !certs_dir.exists() {
        fs::create_dir_all(&certs_dir)
            .map_err(|e| format!("Failed to create certs directory: {}", e))?;
    }
    
    Ok(certs_dir)
}

/**
 * Get the nginx sites-enabled directory
 * /opt/homebrew/etc/nginx/sites-enabled (macOS with Homebrew)
 * /etc/nginx/sites-enabled (Linux)
 */
pub fn get_nginx_sites_enabled() -> Result<PathBuf, String> {
    let sites_enabled_dir = if cfg!(target_os = "macos") {
        PathBuf::from("/opt/homebrew/etc/nginx/sites-enabled")
    } else {
        PathBuf::from("/etc/nginx/sites-enabled")
    };
    
    if !sites_enabled_dir.exists() {
        fs::create_dir_all(&sites_enabled_dir)
            .map_err(|e| format!("Failed to create sites-enabled directory: {}", e))?;
    }
    
    Ok(sites_enabled_dir)
}