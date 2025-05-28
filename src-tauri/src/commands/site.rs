use std::fs;
use tauri::command;

use crate::{
    helpers::{
        hosts,
        nginx::{generate_nginx_config_template, restart_nginx},
        ssl::secure_site,
    },
    models::service::SiteCreatePayload,
};

use shared::{dirs, ssl::{delete_certs}};

#[command]
pub async fn create_site(payload: SiteCreatePayload) -> Result<String, String> {
    let sites_dir = dirs::get_sites()?;
    let nginx_config_dir = dirs::get_nginx()?;
    
    let site_name = &payload.domain.to_lowercase();
    let (domain, tld) = site_name.split_once('.')
        .ok_or_else(|| "Invalid domain. Domain must contain a name and TLD separated by a period (e.g., 'lempify.local')".to_string())?;

    let site_path = sites_dir.join(site_name);
    if site_path.exists() {
        //println!("Site already exists: {}", site_path.display());
        return Err("Site already exists.".to_string());
    }

    fs::create_dir_all(&site_path)
        .map_err(|e| format!("Failed to create site directory: {}", e))?;

    let config_path = nginx_config_dir.join(format!("{site_name}.conf"));
    if !nginx_config_dir.exists() {
        fs::create_dir_all(&nginx_config_dir)
            .map_err(|e| format!("Failed to create nginx config directory: {}", e))?;
    }

    let config_contents = generate_nginx_config_template(domain, &tld, &site_path);

    //println!("Writing config: {}", config_path.display());
    fs::write(&config_path, config_contents)
        .map_err(|e| format!("Failed to write config: {}", e))?;

    hosts::add_entry(&format!("{}.{}", domain, tld))?;

    if payload.ssl {
        secure_site(&format!("{domain}.{tld}"))?;
    }

    Ok(format!("{domain}.{tld}"))
}

#[command]
pub async fn delete_site(domain: String) -> Result<String, String> {
    let domain = domain.to_string();

    let sites_dir = dirs::get_sites()?;
    let nginx_config_dir = dirs::get_nginx()?;

    let site_path = sites_dir.join(&domain);
    let config_path = nginx_config_dir.join(format!("{}.conf", domain));

    // Remove site directory
    if site_path.exists() {
        fs::remove_dir_all(&site_path)
            .map_err(|e| format!("Failed to delete site folder: {}", e))?;
    }

    // Remove NGINX config
    if config_path.exists() {
        fs::remove_file(&config_path)
            .map_err(|e| format!("Failed to remove nginx config: {}", e))?;
    }

    // Remove SSL
    delete_certs(&domain)?;

    // Remove host entry
    hosts::remove_entry(&domain)?;

    // Restart NGINX
    restart_nginx()?;

    Ok(format!("Deleted site: {}", domain))
}
