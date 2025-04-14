use std::fs;
use tauri::command;

use crate::{
    helpers::{
        hosts::{add_host_entry, remove_host_entry},
        nginx::generate_nginx_config_template,
    },
    models::service::SiteCreatePayload,
};

#[command]
pub fn create_site(payload: SiteCreatePayload) -> Result<String, String> {
    let home_dir = dirs::home_dir().ok_or("Could not determine home directory")?;
    let sites_dir = home_dir.join("Lempify/sites");
    let nginx_config_dir = home_dir.join("Lempify/nginx");

    // Get site name and convert to lowercase
    let site_name = &payload.name.to_lowercase();
    let tld = payload.tld.unwrap_or_else(|| "test".to_string());

    let site_path = sites_dir.join(site_name);
    if site_path.exists() {
        println!("Site already exists: {}", site_path.display());
        return Err("Site already exists.".to_string());
    }

    println!("Creating site: {}", site_path.display());

    fs::create_dir_all(&site_path)
        .map_err(|e| format!("Failed to create site directory: {}", e))?;

    let config_path = nginx_config_dir.join(format!("{site_name}.conf"));
    if !nginx_config_dir.exists() {
        println!(
            "Creating nginx config directory: {}",
            nginx_config_dir.display()
        );
        fs::create_dir_all(&nginx_config_dir)
            .map_err(|e| format!("Failed to create nginx config directory: {}", e))?;
    }

    let config_contents = generate_nginx_config_template(site_name, &tld, &site_path);
    println!("Writing config: {}", config_path.display());
    fs::write(&config_path, config_contents)
        .map_err(|e| format!("Failed to write config: {}", e))?;

    add_host_entry(&format!("{}.{}", site_name, tld), "127.0.0.1")?;

    // Restart NGINX
    println!("Restarting nginx");
    std::process::Command::new("brew")
        .args(&["services", "restart", "nginx"])
        .status()
        .map_err(|e| format!("Failed to restart nginx: {}", e))?;

    Ok(format!("{site_name}.{tld}"))
}

#[command]
pub fn delete_site(name: String, tld: Option<String>) -> Result<String, String> {
    let tld = tld.unwrap_or_else(|| "test".into());
    let domain = format!("{}.{}", name, tld);

    let home = dirs::home_dir().ok_or("Could not find home directory")?;
    let site_path = home.join("Lempify/sites").join(&name);
    let config_path = home.join("Lempify/nginx").join(format!("{}.conf", name));

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

    // Remove /etc/hosts entry
    remove_host_entry(&domain)?;

    // Restart NGINX
    std::process::Command::new("brew")
        .args(&["services", "restart", "nginx"])
        .status()
        .map_err(|e| format!("Failed to restart nginx: {}", e))?;

    Ok(format!("Deleted site: {}", domain))
}
