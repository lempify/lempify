use std::fs;
use tauri::{command, State};

use crate::{
    helpers::{
        hosts,
        nginx::{generate_nginx_config_template, restart_nginx},
        ssl::secure_site,
    },
    models::{
        config::{ConfigManager, SiteBuilder, SiteConfig, SiteServices},
        service::SiteCreatePayload,
    },
};

use shared::{
    dirs, 
    ssl::delete_certs, 
    utils::FileSudoCommand
};

/// Write a file to a system location that requires elevated permissions
fn write_file_with_sudo(content: &str, target_path: &std::path::Path) -> Result<(), String> {
    FileSudoCommand::write(content.to_string(), target_path.to_path_buf()).run()
}

/// Remove a file from a system location that requires elevated permissions
fn remove_file_with_sudo(target_path: &std::path::Path) -> Result<(), String> {
    FileSudoCommand::remove(target_path.to_path_buf()).run()
}

#[command]
pub async fn create_site(
    config_manager: State<'_, ConfigManager>,
    payload: SiteCreatePayload,
) -> Result<String, String> {
    println!("Creating site: {:?}", payload);

    let sites_dir = dirs::get_sites()?;
    let nginx_sites_enabled_dir = dirs::get_nginx_sites_enabled()?;

    let site_name = &payload.domain.to_lowercase();
    let (domain, tld) = site_name.split_once('.')
    .ok_or_else(|| "Invalid domain. Domain must contain a name and TLD separated by a period (e.g., 'lempify.local')".to_string())?;

    let full_domain = format!("{}.{}", domain, tld);
    let site_path = sites_dir.join(site_name);

    println!("- Name: {} \n- Domain:{}", site_name, full_domain);

    if site_path.exists() {
        return Err("Site already exists.".to_string());
    }

    // Check if site already exists in config
    if config_manager.get_site(&full_domain).await.is_some() {
        return Err("Site already exists in configuration.".to_string());
    }

    // Create the site directory
    fs::create_dir_all(&site_path)
        .map_err(|e| format!("Failed to create site directory: {}", e))?;

    let config_path = nginx_sites_enabled_dir.join(format!("{site_name}.conf"));
    let config_contents = generate_nginx_config_template(domain, &tld, &site_path);
    println!("Creating NGINX file");
    write_file_with_sudo(&config_contents, &config_path)?;

    println!("Adding to Host");
    // Add to hosts file
    hosts::add_entry(&full_domain)?;

    println!("Adding SSL");
    // Setup SSL if requested
    if payload.ssl {
        secure_site(&full_domain)?;
    }

    println!("Building site config");
    // Create site object and store in config.json
    let site_services = SiteServices {
        php: "8.4".to_string(),
        mysql: "8.0".to_string(),
        nginx: "1.25".to_string(),
    };

    let ssl_key = if payload.ssl {
        Some(format!(
            "/opt/homebrew/etc/nginx/ssl/{}-key.pem",
            full_domain
        ))
    } else {
        None
    };

    let ssl_cert = if payload.ssl {
        Some(format!("/opt/homebrew/etc/nginx/ssl/{}.pem", full_domain))
    } else {
        None
    };

    let site_config = SiteConfig {
        ssl: payload.ssl,
        root: site_path.to_string_lossy().to_string(),
        logs: format!("{}/logs", site_path.to_string_lossy()),
        ssl_key,
        ssl_cert,
    };

    let site = SiteBuilder::new()
        .name(&full_domain)
        .domain(&full_domain)
        .ssl(payload.ssl)
        .services(site_services)
        .site_type(&payload._site_type)
        .language("php")
        .database("mysql")
        .site_config(site_config)
        .path(site_path.to_string_lossy().to_string())
        .build()?;

    println!("Writing To Config: {:#?}", site);

    // Store in config.json
    config_manager.create_site(site).await?;

    println!("Done!");

    Ok(full_domain)
}

#[command]
pub async fn delete_site(
    config_manager: State<'_, ConfigManager>,
    domain: String,
) -> Result<String, String> {
    let sites_dir = dirs::get_sites()?;
    let nginx_sites_enabled_dir = dirs::get_nginx_sites_enabled()?;

    let site_path = sites_dir.join(&domain);
    let config_path = nginx_sites_enabled_dir.join(format!("{}.conf", domain));

    if site_path.exists() {
        fs::remove_dir_all(&site_path)
            .map_err(|e| format!("Failed to delete site folder: {}", e))?;
    }

    remove_file_with_sudo(&config_path)?;

    delete_certs(&domain)?;

    hosts::remove_entry(&domain)?;

    let _ = config_manager.delete_site(&domain).await; // Don't fail if not in config

    // Restart NGINX
    restart_nginx()?;

    Ok(format!("Deleted site: {}", domain))
}
