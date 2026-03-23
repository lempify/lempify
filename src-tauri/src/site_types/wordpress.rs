use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::{
    fs::{self, File}, path::PathBuf, process::Command
};
use whoami;

use shared::file_system::AppFileSystem;

use crate::constants;

#[derive(Debug, Serialize, Deserialize)]
pub struct WordPressVersionResponse {
    pub offers: Vec<WordPressOffer>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CachedWordPressVersions {
    pub data: WordPressVersionResponse,
    pub expires: u64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WordPressOffer {
    pub response: String,
    pub download: String,
    pub locale: String,
    pub packages: WordPressPackages,
    pub current: String,
    pub version: String,
    pub php_version: String,
    pub mysql_version: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WordPressPackages {
    pub full: String,
    pub no_content: String,
    pub new_bundled: String,
    pub partial: serde_json::Value,  // Can be false or object
    pub rollback: serde_json::Value, // Can be false or object
}

/**
 * WordPress versions
 *
 * This function will return a list of WordPress versions that are available to install. Cache the value for 1 hour
 *
 * @returns A list of WordPress versions
 */
pub async fn versions() -> Result<WordPressVersionResponse, String> {
    let app_fs = AppFileSystem::new().map_err(|e| e.to_string())?;
    // Check if the cache is valid.
    let cache_path = app_fs.cache_dir.join("wordpress-versions.json");

    // Ensure cache directory always exists before any read or write
    fs::create_dir_all(&app_fs.cache_dir).map_err(|e| e.to_string())?;

    if cache_path.exists() {
        let cache_file = File::open(&cache_path).map_err(|e| e.to_string())?;
        let cache_data: CachedWordPressVersions =
            serde_json::from_reader(cache_file).map_err(|e| e.to_string())?;
        if cache_data.expires > Utc::now().timestamp() as u64 {
            return Ok(cache_data.data);
        }
    }

    println!("Updating WP VERSIONS cache");

    let response = reqwest::get(constants::WP_VERSION_ENDPOINT)
        .await
        .map_err(|e| e.to_string())?;

    let versions = response
        .json::<WordPressVersionResponse>()
        .await
        .map_err(|e| e.to_string())?;

    // Cache the data
    let cache_data = CachedWordPressVersions {
        data: versions,
        expires: Utc::now().timestamp() as u64 + 3600,
    };

    // Write the cache
    let cache_file = File::create(&cache_path).map_err(|e| e.to_string())?;
    serde_json::to_writer_pretty(cache_file, &cache_data).map_err(|e| e.to_string())?;

    Ok(cache_data.data)
}

pub fn cli_install_site(file_system: &PathBuf, url: &str, title: &str) -> Result<(), String> {
    let output = Command::new("wp")
        .current_dir(file_system)
        .arg("core")
        .arg("install")
        .arg(format!("--url={}", url))
        .arg(format!("--title={}", title))
        .arg("--admin_user=admin")
        .arg("--admin_password=password")
        .arg("--admin_email=admin@example.com")
        .output()
        .map_err(|e| e.to_string())?;

    println!("WP-CLI install site output: {:?}", output);
    Ok(())
}

/**
 * Fix WordPress file permissions and ownership
 *
 * Sets proper ownership and permissions for wp-content and wp-content/uploads directories
 * to allow PHP-FPM to write uploaded files.
 *
 * @param site_dir The path to the WordPress site directory
 * @returns Result<(), String>
 */
pub fn fix_permissions(site_dir: &PathBuf) -> Result<(), String> {
    let wp_content_dir = site_dir.join("wp-content");
    let wp_uploads_dir = wp_content_dir.join("uploads");
    
    // Get current username (the user running PHP-FPM)
    let username = whoami::username();
    
    // Ensure wp-content/uploads directory exists
    if !wp_uploads_dir.exists() {
        fs::create_dir_all(&wp_uploads_dir)
            .map_err(|e| format!("Failed to create wp-content/uploads directory: {}", e))?;
    }
    
    // Set ownership of wp-content directory to current user
    Command::new("chown")
        .arg("-R")
        .arg(&username)
        .arg(&wp_content_dir)
        .status()
        .map_err(|e| format!("Failed to set wp-content ownership: {}", e))?;
    
    // Set permissions to 755 (rwxr-xr-x) for wp-content directory
    let mut perms = fs::metadata(&wp_content_dir)
        .map_err(|e| format!("Failed to get wp-content directory metadata: {}", e))?
        .permissions();
    perms.set_readonly(false);
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        perms.set_mode(0o755);
    }
    fs::set_permissions(&wp_content_dir, perms)
        .map_err(|e| format!("Failed to set wp-content directory permissions: {}", e))?;
    
    // Set permissions to 775 (rwxrwxr-x) for wp-content/uploads directory
    // This allows the web server (PHP-FPM) to write uploaded files
    let mut uploads_perms = fs::metadata(&wp_uploads_dir)
        .map_err(|e| format!("Failed to get wp-content/uploads directory metadata: {}", e))?
        .permissions();
    uploads_perms.set_readonly(false);
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        uploads_perms.set_mode(0o775);
    }
    fs::set_permissions(&wp_uploads_dir, uploads_perms)
        .map_err(|e| format!("Failed to set wp-content/uploads directory permissions: {}", e))?;
    
    println!("wp-content directory ownership and permissions set successfully");
    Ok(())
}

/* 
SITE_DIR="/opt/homebrew/var/www/msnow.local" && \
mkdir -p "$SITE_DIR/wp-content/uploads" && \
chown -R $(whoami) "$SITE_DIR/wp-content" && \
chmod 755 "$SITE_DIR/wp-content" && \
chmod 775 "$SITE_DIR/wp-content/uploads"
*/