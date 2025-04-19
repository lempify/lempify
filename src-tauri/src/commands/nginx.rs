use std::fs;
use tauri::command;

use crate::helpers::hosts::is_host_entry_exists;
use crate::helpers::nginx::generate_nginx_config_template;
use crate::helpers::paths::{get_nginx_dir, get_sites_dir};
use crate::models::service::{ServiceType, SiteInfo};

use super::start_stop::restart_service;

#[command]
pub async fn generate_nginx_config(domain: String) -> Result<SiteInfo, String> {
    let nginx_config_dir = get_nginx_dir()?;

    if !nginx_config_dir.exists() {
        fs::create_dir_all(&nginx_config_dir)
            .map_err(|e| format!("Failed to create nginx config directory: {}", e))?;
    }

    let sites_dir = get_sites_dir()?;
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
        Some(is_host_entry_exists(&domain)?),
        Some(config_path.display().to_string()),
    ))
}
