use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::fs::{self, File};

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

    if cache_path.exists() {
        let cache_file = File::open(&cache_path).map_err(|e| e.to_string())?;
        let cache_data: CachedWordPressVersions =
            serde_json::from_reader(cache_file).map_err(|e| e.to_string())?;
        if cache_data.expires > Utc::now().timestamp() as u64 {
            return Ok(cache_data.data);
        }
    } else {
        // Create cache directory
        let cache_dir = app_fs.config_dir.join("cache");
        fs::create_dir_all(&cache_dir).map_err(|e| e.to_string())?;
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
