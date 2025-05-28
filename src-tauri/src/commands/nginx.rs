use std::fs;
use tauri::command;

use shared::{hosts::entry_exists, nginx::generate_nginx_config_template, ssl};

use crate::models::service::{ServiceType, SiteInfo};

use shared::dirs;

use super::start_stop::restart_service;

#[command]
pub async fn generate_nginx_config(domain: String) -> Result<SiteInfo, String> {
    let nginx_config_dir = dirs::get_nginx()?;

    if !nginx_config_dir.exists() {
        fs::create_dir_all(&nginx_config_dir)
            .map_err(|e| format!("Failed to create nginx config directory: {}", e))?;
    }

    let sites_dir = dirs::get_sites()?;
    let site_path = sites_dir.join(&domain);
    if !site_path.exists() {
        return Err(format!("Site directory not found: {}", site_path.display()));
    }

    let config_path = nginx_config_dir.join(format!("{}.conf", domain));
    let config_contents = generate_nginx_config_template(&domain, "test", &site_path);

    fs::write(&config_path, config_contents)
        .map_err(|e| format!("Failed to write config: {}", e))?;

    // Restart nginx
    restart_service(ServiceType::Nginx).await?;

    Ok(SiteInfo::build(
        domain.to_string(),
        Some(domain.to_string()),
        Some(site_path.exists()),
        Some(entry_exists(&domain)?),
        Some(config_path.display().to_string()),
        Some(ssl::has_ssl(&domain).unwrap_or(false)),
    ))
}
