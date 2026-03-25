use mysql::prelude::*;
use mysql::*;
use reqwest;
use shared::brew;
use std::fs;
use std::fs::File;
use tauri::{AppHandle, Emitter};
use zip;

use shared::file_system::AppFileSystem;

use crate::constants;
use crate::helpers::config::get_settings;
use crate::helpers::utils::copy_zip_entry_to_path;
use crate::site_types::wordpress;

/**
 * Download WordPress zip and extract to `~/Library/Application Support/Lempify/site-types/wordpress/{version}`.
 */
pub async fn wordpress<R: tauri::Runtime>(version: &str, app: &AppHandle<R>) -> Result<(), String> {
    app.emit("site:progress", "Preparing WordPress files").ok();

    // If downloaded version exists, exit early.
    let config_dir = AppFileSystem::new()?.config_dir;
    // ~/Library/Application Support/Lempify/site-types/wordpress/wordpress-{version}.zip
    let wordpress_zip_path = config_dir
        .join("site-types")
        .join("wordpress")
        .join(format!("{}", version));

    if wordpress_zip_path.exists() {
        return Ok(());
    }

    app.emit("site:progress", "Downloading WordPress").ok();

    let site_type_dir = config_dir.join("site-types").join("wordpress");
    if !site_type_dir.exists() {
        fs::create_dir_all(&site_type_dir).map_err(|e| {
            format!(
                "/src/site_types/install.rs: Failed to create WordPress directory: {}",
                e
            )
        })?;
    }

    // ~/Library/Application Support/Lempify/site-types/wordpress/wordpress-{version}.zip
    let wordpress_zip_path = &site_type_dir.join(format!("wordpress-{}.zip", version));

    // https://wordpress.org/latest.zip OR https://wordpress.org/wordpress-{version}.zip
    let wordpress_zip_url = if version == "latest" {
        format!("{}/latest.zip", constants::WP_ORG_URL)
    } else {
        format!("{}/wordpress-{}.zip", constants::WP_ORG_URL, version)
    };

    let wordpress_zip_data = reqwest::get(wordpress_zip_url)
        .await
        .map_err(|e| format!("Failed to download WordPress: {}", e))?
        .bytes()
        .await
        .map_err(|e| format!("Failed to read WordPress download: {}", e))?;

    fs::write(&wordpress_zip_path, &wordpress_zip_data)
        .map_err(|e| format!("Failed to write WordPress zip: {}", e))?;

    let mut wordpress_zip = zip::ZipArchive::new(
        File::open(&wordpress_zip_path)
            .map_err(|e| format!("Failed to open WordPress zip: {}", e))?,
    )
    .map_err(|_| "Failed to open WordPress zip".to_string())?;

    // Extract to temporary directory first
    let temp_extract_dir = site_type_dir.join("temp_extract");
    fs::create_dir_all(&temp_extract_dir)
        .map_err(|e| format!("Failed to create temp extraction directory: {}", e))?;

    for i in 0..wordpress_zip.len() {
        let mut file = wordpress_zip
            .by_index(i)
            .map_err(|e| format!("Failed to get file: {}", e))?;
        let outpath = temp_extract_dir.join(file.name());
        copy_zip_entry_to_path(&mut file, &outpath)?;
    }

    // Move the wordpress folder contents to the version directory
    let wordpress_extracted_dir = temp_extract_dir.join("wordpress");
    let final_version_dir = site_type_dir.join(version);

    if wordpress_extracted_dir.exists() {
        fs::rename(&wordpress_extracted_dir, &final_version_dir)
            .map_err(|e| format!("Failed to move WordPress files to version directory: {}", e))?;
    }

    // Clean up temp directory
    fs::remove_dir_all(&temp_extract_dir)
        .map_err(|e| format!("Failed to cleanup temp directory: {}", e))?;
    // delete the zip file
    fs::remove_file(wordpress_zip_path)
        .map_err(|e| format!("Failed to delete WordPress zip: {}", e))?;

    app.emit("site:progress", "WordPress ready").ok();

    Ok(())
}

pub async fn site<R: tauri::Runtime>(
    site_type: &str,
    site_name: &str,
    site_tld: &str,
    ssl: bool,
    version: &str,
    app: &AppHandle<R>,
) -> Result<(), String> {
    let db_name = format!("{}-{}", site_name, site_tld);
    let domain = format!("{}.{}", site_name, site_tld);
    match site_type {
        "wordpress" => {
            let app_fs = AppFileSystem::new()?;
            let site_dir = app_fs.sites_dir.join(&domain);

            let settings = get_settings().await;

            app.emit("site:progress", "Writing configuration").ok();

            // wp-config.php - start

            let wp_config_var_values: &[(&str, &str)] = &[
                // DB
                ("{{DB_NAME}}", &db_name),
                ("{{DB_USER}}", &settings.mysql_user),
                ("{{DB_PASSWORD}}", &settings.mysql_password),
                ("{{DB_HOST}}", &settings.mysql_host),
                ("{{DB_PORT}}", &settings.mysql_port.to_string()),
                // Object Cache
                ("{{LEMPIFY_OBJECT_CACHE}}", "none"),
            ];
            let wp_config_path = site_dir.join("wp-config.php");

            let mut wp_config_contents = fs::read_to_string(&wp_config_path).map_err(|e| {
                format!(
                    "Failed to read wp-config.php: {} - {}",
                    e,
                    wp_config_path.display()
                )
            })?;
            for (key, value) in wp_config_var_values {
                wp_config_contents = wp_config_contents.replace(key, value);
            }
            fs::write(&wp_config_path, &wp_config_contents)
                .map_err(|e| format!("Failed to write wp-config.php: {}", e))?;

            // Set proper permissions (readable by web server)
            let mut perms = fs::metadata(&wp_config_path)
                .map_err(|e| format!("Failed to get wp-config.php metadata: {}", e))?
                .permissions();
            perms.set_readonly(false);
            fs::set_permissions(&wp_config_path, perms)
                .map_err(|e| format!("Failed to set wp-config.php permissions: {}", e))?;
            // wp-config.php - end

            app.emit("site:progress", "Creating database").ok();

            if !brew::is_service_running("mysql") {
                return Err("MySQL is not running.".to_string());
            }
            // MySQL DB - start
            // @TODO: Add user creation and password update.
            let mysql_db_create_query =
                format!("CREATE DATABASE IF NOT EXISTS `{}`", db_name);

            let conn_str = format!(
                "mysql://{}:{}@{}:{}/",
                settings.mysql_user,
                settings.mysql_password,
                settings.mysql_host,
                settings.mysql_port
            );

            let pool = Pool::new(conn_str.as_str())
                .map_err(|e| format!("Failed to connect to MySQL: {}", e))?;

            let mut conn = pool
                .get_conn()
                .map_err(|e| format!("Failed to get MySQL connection: {}", e))?;

            conn.query_drop(mysql_db_create_query)
                .map_err(|e| format!("Failed to create MySQL DB: {}", e))?;

            // MySQL DB - end

            // Fix WordPress file permissions and ownership
            wordpress::fix_permissions(&site_dir)?;

            app.emit("site:progress", "Setting up WordPress").ok();

            let site_url = format!("{}://{}", if ssl { "https" } else { "http" }, domain);
            let site_title = format!("{} Site", site_name);
            let wp_version_dir = app_fs
                .site_types_dir
                .join("wordpress")
                .join(version);
            wordpress::setup_database(&wp_version_dir, &site_url, &site_title, &db_name, &settings)?;

            Ok(())
        }
        _ => Ok(()),
    }
}
