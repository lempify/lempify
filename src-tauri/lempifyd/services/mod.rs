pub mod composer;
pub mod config;
pub mod error;
pub mod isolation;
pub mod mailpit;
pub mod memcached;
pub mod mkcert;
pub mod mysql;
pub mod nginx;
pub mod php;
pub mod redis;
pub mod wp_cli;

use crate::models::Service;
use shared::constants::{DEFAULT_PHP_VERSION, PHP_SUPPORTED_VERSIONS};
use shared::file_system::AppFileSystem;

/// Reads config.json and returns the unique PHP versions used across all sites.
fn get_php_versions_from_config() -> Vec<String> {
    let Ok(app_fs) = AppFileSystem::new() else {
        return Vec::new();
    };
    let config_path = app_fs.config_dir.join("config.json");
    let Ok(content) = std::fs::read_to_string(config_path) else {
        return Vec::new();
    };
    let Ok(value) = serde_json::from_str::<serde_json::Value>(&content) else {
        return Vec::new();
    };

    let sites = value
        .get("sites")
        .and_then(|s| s.as_array())
        .map(|sites| {
            let mut seen: Vec<String> = Vec::new();
            for site in sites {
                if let Some(v) = site
                    .get("services")
                    .and_then(|s| s.get("php"))
                    .and_then(|v| v.as_str())
                {
                    let version = v.to_string();
                    if !seen.contains(&version) {
                        seen.push(version);
                    }
                }
            }
            seen
        })
        .unwrap_or_default();

    sites
}

/// Returns the actual version string reported by the unversioned Homebrew PHP binary.
fn default_php_binary_version() -> Option<String> {
    let output = std::process::Command::new("/opt/homebrew/opt/php/bin/php")
        .args(["-n", "-r", "echo PHP_MAJOR_VERSION . '.' . PHP_MINOR_VERSION;"])
        .stdin(std::process::Stdio::null())
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::null())
        .output()
        .ok()?;
    let v = String::from_utf8_lossy(&output.stdout).trim().to_string();
    if v.contains('.') { Some(v) } else { None }
}

/// Returns all PHP versions that should have a registered service:
/// - versions used by active sites (from config.json)
/// - any supported version whose php-fpm binary is present on disk
/// - always includes DEFAULT_PHP_VERSION as a fallback
fn get_php_versions() -> Vec<String> {
    let mut versions = get_php_versions_from_config();

    // Detect the actual version behind the unversioned 'php' formula once
    let default_version = default_php_binary_version();

    // Include any installed version not already covered by config
    for &version in PHP_SUPPORTED_VERSIONS {
        if versions.iter().any(|v| v == version) {
            continue;
        }
        let versioned = format!("/opt/homebrew/opt/php@{}/sbin/php-fpm", version);
        // Only claim the unversioned path if it actually matches this version
        let is_default_installed = default_version.as_deref() == Some(version)
            && std::path::Path::new("/opt/homebrew/opt/php/sbin/php-fpm").exists();
        if std::path::Path::new(&versioned).exists() || is_default_installed {
            versions.push(version.to_string());
        }
    }

    if versions.is_empty() {
        versions.push(DEFAULT_PHP_VERSION.to_string());
    }

    versions
}

/// Returns all available services. PHP services are registered for every
/// version active in config.json plus every version installed on disk.
pub fn get_all_services() -> Vec<Box<dyn Service>> {
    let php_versions = get_php_versions();

    let mut services: Vec<Box<dyn Service>> = php_versions
        .iter()
        .filter_map(|version| {
            php::Service::new(version.as_str())
                .map(|s| Box::new(s) as Box<dyn Service>)
                .ok()
        })
        .collect();

    services.push(Box::new(nginx::Service::new("1.27").expect("Failed to create NGINX service")));
    services.push(Box::new(mysql::Service::new("9.2").expect("Failed to create MySQL service")));
    services.push(Box::new(redis::Service::new("8.2").expect("Failed to create Redis service")));
    services.push(Box::new(memcached::Service::new("1.6").expect("Failed to create Memcached service")));
    services.push(Box::new(composer::Service::new("2.8").expect("Failed to create Composer service")));
    services.push(Box::new(mailpit::Service::new("1.27").expect("Failed to create Mailpit service")));
    services.push(Box::new(wp_cli::Service::new("2.12").expect("Failed to create WP-CLI service")));
    services.push(Box::new(mkcert::Service::new("1.4").expect("Failed to create mkcert service")));

    services
}
