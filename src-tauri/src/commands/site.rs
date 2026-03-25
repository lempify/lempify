use std::{fs, process::Command, time::SystemTime};
use tauri::{command, AppHandle, Emitter, State};

use crate::{
    helpers::{
        hosts,
        ssl::secure_site,
        stubs::{create_nginx_config_stub, create_site_type_stub},
    },
    models::{
        config::{ConfigManager, Site, SiteBuilder, SiteConfig, SiteServices, PingData},
        service::SiteCreatePayload,
    },
    site_types::{install, uninstall, wordpress},
};

use shared::{constants::DEFAULT_PHP_VERSION, file_system::AppFileSystem, ssl, utils_legacy::FileSudoCommand};

/// Remove a file from a system location that requires elevated permissions
fn remove_file_with_sudo(target_path: &std::path::Path) -> Result<(), String> {
    FileSudoCommand::remove(target_path.to_path_buf()).run()
}

#[command]
// @TODO: wire up site_type_config, either.
//  - https://github.com/ronaldbradford/schema/blob/master/wordpress.sql
//  - WP CLI
pub async fn create_site<R: tauri::Runtime>(
    app: AppHandle<R>,
    config_manager: State<'_, ConfigManager>,
    payload: SiteCreatePayload,
) -> Result<Site, String> {
    let app_fs = AppFileSystem::new()?;

    let domain = &payload.domain.to_lowercase();
    let (domain_name, domain_tld) =
        domain.split_once('.')
            .ok_or_else(|| "Invalid domain. Domain must contain a name and TLD separated by a period (e.g., 'lempify.local')".to_string())?;

    let site_path = app_fs.sites_dir.join(&domain);

    let site_type = &payload.site_type;

    if site_path.exists() {
        return Err("Site already exists.".to_string());
    }

    // Check if site already exists in config
    // @TODO: add more robust checking. E.g. a site fs can exist and not be in config.
    if config_manager.get_site(&domain).await.is_some() {
        return Err("Site already exists in configuration.".to_string());
    }

    // Create the site directory
    app_fs
        .create_dir_all(&site_path)
        .map_err(|e| format!("Failed to create site directory: {}", e))?;

    // Create site object and store in config.json
    let site_services = SiteServices {
        php: DEFAULT_PHP_VERSION.to_string(),
        mysql: "8.0".to_string(),
        nginx: "1.25".to_string(),
    };

    // Generate isolated PHP socket path for lempifyd
    let php_socket = format!(
        "unix:/tmp/lempify/services/php/sockets/php-{}.sock",
        site_services.php
    );

    let _ = create_nginx_config_stub(&domain, Some(&php_socket))?;

    // Add to hosts file
    hosts::add_entry(&domain)?;

    // Setup SSL if requested
    if payload.ssl {
        secure_site(&domain, &config_manager).await?;
    }
    let ssl_key = if payload.ssl {
        Some(format!("/opt/homebrew/etc/nginx/ssl/{}-key.pem", domain))
    } else {
        None
    };

    let ssl_cert = if payload.ssl {
        Some(format!("/opt/homebrew/etc/nginx/ssl/{}.pem", domain))
    } else {
        None
    };

    // Install Site Type
    if site_type == "wordpress" {
        app.emit("site:progress", "Resolving WordPress version").ok();

        // Install WordPress if it doesn't exist.
        let latest_version = match wordpress::versions().await {
            Ok(versions) => {
                let version = &versions.offers[0].version;
                version.to_string()
            }
            Err(e) => {
                println!(
                    "Warning: Failed to fetch WordPress versions, installing latest: {}",
                    e
                );
                "latest".to_string()
            }
        };

        app.emit("site:progress", "Preparing WordPress").ok();
        install::wordpress(&latest_version, &app).await?;

        app.emit("site:progress", "Installing WordPress files").ok();
        // Add site type stub.
        create_site_type_stub(&site_type, &domain, &latest_version)?;

        app.emit("site:progress", "Configuring site").ok();
        // Install WordPress dependencies.
        install::site(&site_type, &domain_name, &domain_tld, payload.ssl, &latest_version, &app).await?;
    } else if site_type == "vanilla" {
        // Install Vanilla dependencies.
        create_site_type_stub(&site_type, &domain, "")?;
        install::site(&site_type, &domain_name, &domain_tld, payload.ssl, "", &app).await?;
    } else {
        return Err(format!("Invalid site type: {}", site_type));
    }

    let site_config = SiteConfig {
        ssl: payload.ssl,
        root: site_path.to_string_lossy().to_string(),
        logs: format!("{}/logs", site_path.to_string_lossy()),
        ssl_key,
        ssl_cert,
    };

    let site = SiteBuilder::new()
        .name(payload.site_name)
        .domain(format!("{}.{}", domain_name, domain_tld))
        .ssl(payload.ssl)
        .created(SystemTime::now().duration_since(SystemTime::UNIX_EPOCH).unwrap().as_millis())
        .services(site_services)
        .site_type(&payload.site_type)
        // @TODO: make this dynamic
        .language("php")
        // @TODO: make this dynamic
        .database("mysql")
        .site_config(site_config)
        .path(site_path.to_string_lossy().to_string())
        .build()?;

    // Store in config.json
    config_manager.create_site(&site).await?;

    app.emit("site:progress", "Reloading NGINX").ok();

    Command::new("nginx").arg("-s").arg("reload")
        .status()
        .map_err(|e| format!("Failed to reload nginx: {}", e))?;

    app.emit("site:progress", "Done").ok();

    Ok(site)
}

#[command]
pub async fn delete_site(
    config_manager: State<'_, ConfigManager>,
    domain: String,
) -> Result<Vec<Site>, String> {
    let app_fs = AppFileSystem::new()?;
    let site_conf_path = app_fs.nginx_sites_enabled_dir.join(format!("{}.conf", domain));

    let (domain_name, domain_tld) = domain
        .split_once('.')
        .ok_or_else(|| "Invalid domain format".to_string())?;

    remove_file_with_sudo(&site_conf_path)?;

    let site_config = config_manager
        .get_site(&domain)
        .await
        .ok_or("Site not found")?;

    let site_type: &str = &site_config.site_type;

    let site_path = app_fs.sites_dir.join(&domain);

    if site_path.exists() {
        fs::remove_dir_all(&site_path)
            .map_err(|e| format!("Failed to delete site folder: {}", e))?;
    }

    ssl::delete_certs(&domain)?;

    hosts::remove_entry(&domain)?;

    if site_type == "wordpress" {
        uninstall::wordpress(&domain_name, &domain_tld).await?;
    }

    let _ = config_manager.delete_site(&domain).await; // Don't fail if not in config

    // Reload NGINX
    Command::new("nginx").arg("-s").arg("reload")
        .status()
        .map_err(|e| format!("Failed to reload nginx: {}", e))?;

    let sites = config_manager.get_all_sites().await;

    Ok(sites)
}

#[command]
pub async fn ping_site(config_manager: State<'_, ConfigManager>, domain: String) -> Result<PingData, String> {
    let mut site = config_manager.get_site(&domain).await.ok_or("Site not found")?;
    let scheme = if site.ssl { "https" } else { "http" };

    let output = Command::new("curl")
        .arg("-sfk")
        .arg(format!("{}://{}", scheme, domain))
        .output()
        .map_err(|e| format!("Failed to ping site: {}", e))?;

    let ping = PingData {
        online: output.status.success(),
        timestamp: SystemTime::now().duration_since(SystemTime::UNIX_EPOCH).unwrap().as_millis(),
    };
    site.ping = Some(ping);

    config_manager.update_site(&domain, site).await?;

    Ok(ping)
}
