use std::fs;
use tauri::{command, State};

use crate::{
    helpers::{
        hosts,
        nginx::{generate_nginx_config_template, restart_nginx},
        ssl::secure_site, stubs::create_site_type_stub,
    },
    models::{
        config::{ConfigManager, Site, SiteBuilder, SiteConfig, SiteServices},
        service::SiteCreatePayload,
    },
    site_types::{install, wordpress},
};

use shared::{dirs, ssl::delete_certs, utils::FileSudoCommand};

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
) -> Result<Site, String> {
    println!("Creating site: {:?}", payload);

    let sites_dir = dirs::get_sites()?;
    let nginx_sites_enabled_dir = dirs::get_nginx_sites_enabled()?;

    let domain = &payload.domain.to_lowercase();
    let (domain_name, domain_tld) = 
        domain.split_once('.')
            .ok_or_else(|| "Invalid domain. Domain must contain a name and TLD separated by a period (e.g., 'lempify.local')".to_string())?;
        
    let site_path = sites_dir.join(&domain);

    if site_path.exists() {
        return Err("Site already exists.".to_string());
    }

    // Check if site already exists in config
    if config_manager.get_site(&domain).await.is_some() {
        return Err("Site already exists in configuration.".to_string());
    }

    // Create the site directory
    fs::create_dir_all(&site_path)
        .map_err(|e| format!("Failed to create site directory: {}", e))?;

    let config_path = nginx_sites_enabled_dir.join(format!("{domain}.conf"));
    let config_contents = generate_nginx_config_template(domain_name, &domain_tld, &site_path);
    
    write_file_with_sudo(&config_contents, &config_path)?;

    println!("Adding to Host");
    // Add to hosts file
    hosts::add_entry(&domain)?;

    
    println!("Building site config");
    // Create site object and store in config.json
    let site_services = SiteServices {
        php: "8.4".to_string(),
        mysql: "8.0".to_string(),
        nginx: "1.25".to_string(),
    };
    
    println!("Adding SSL");
    // Setup SSL if requested
    if payload.ssl {
        secure_site(&domain)?;
    }
    let ssl_key = if payload.ssl {
        Some(format!(
            "/opt/homebrew/etc/nginx/ssl/{}-key.pem",
            domain
        ))
    } else {
        None
    };

    let ssl_cert = if payload.ssl {
        Some(format!("/opt/homebrew/etc/nginx/ssl/{}.pem", domain))
    } else {
        None
    };

    // Add site type stub.
    create_site_type_stub(&payload.site_type, &domain)?;

    // Install WordPress if it doesn't exist
    if payload.site_type == "wordpress" {
        // Install WordPress if it doesn't exist
        let latest_version = match wordpress::versions().await {
            Ok(versions) => {
                let version = &versions.offers[0].version;
                println!("WordPress latest version: {:#?}", version);
                version.to_string()
            }
            Err(e) => {
                println!("Warning: Failed to fetch WordPress versions, installing latest: {}", e); 
                "latest".to_string()
            }
        };
        install::wordpress(&latest_version).await?;
    }

    let site_config = SiteConfig {
        ssl: payload.ssl,
        root: site_path.to_string_lossy().to_string(),
        logs: format!("{}/logs", site_path.to_string_lossy()),
        ssl_key,
        ssl_cert,
    };

    let site = SiteBuilder::new()
        .name(domain)
        .domain(format!("{}.{}", domain_name, domain_tld))
        .ssl(payload.ssl)
        .services(site_services)
        .site_type(&payload.site_type)
        .language("php")
        .database("mysql")
        .site_config(site_config)
        .path(site_path.to_string_lossy().to_string())
        .build()?;

    println!("Writing To Config: {:#?}", site);

    // Store in config.json
    config_manager.create_site(&site).await?;

    println!("Done!");

    Ok(site)
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
