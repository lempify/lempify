use std::fs;
use tauri::command;

use shared::{brew, file_system::AppFileSystem, hosts::entry_exists, ssl};

use crate::{helpers::stubs::create_nginx_config_stub, models::service::SiteInfo};

#[command]
pub async fn generate_nginx_config(domain: String) -> Result<SiteInfo, String> {
    let app_fs = AppFileSystem::new()?;
    let nginx_sites_enabled_dir = app_fs.nginx_sites_enabled_dir;

    if !nginx_sites_enabled_dir.exists() {
        fs::create_dir_all(&nginx_sites_enabled_dir)
            .map_err(|e| format!("Failed to create nginx config directory: {}", e))?;
    }

    let sites_dir = app_fs.sites_dir;
    let site_path = sites_dir.join(&domain);
    if !site_path.exists() {
        return Err(format!("Site directory not found: {}", site_path.display()));
    }

    let config_path = create_nginx_config_stub(&domain)?;

    brew::restart_service("nginx")?;

    Ok(SiteInfo::build(
        domain.to_string(),
        Some(domain.to_string()),
        Some(site_path.exists()),
        Some(entry_exists(&domain)?),
        Some(config_path),
        Some(ssl::has_ssl(&domain).unwrap_or(false)),
    ))
}
