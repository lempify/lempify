use mysql::prelude::*;
use mysql::*;
use reqwest;
use std::fs;
use std::fs::File;
use zip;

use shared::file_system::AppFileSystem;

use crate::constants;
use crate::helpers::config::get_settings;
use crate::helpers::utils::copy_zip_entry_to_path;

/**
 * Download WordPress zip and extract to `~/Library/Application Support/Lempify/site-types/wordpress/{version}`.
 */
pub async fn wordpress(version: &str) -> Result<(), String> {
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
        .unwrap()
        .bytes()
        .await
        .unwrap();

    let _ = fs::write(&wordpress_zip_path, wordpress_zip_data);

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

    Ok(())
}

pub async fn site(site_type: &str, site_name: &str, site_tld: &str) -> Result<(), String> {
    let db_name = format!("{}-{}", site_name, site_tld);
    let domain = format!("{}.{}", site_name, site_tld);
    match site_type {
        "wordpress" => {
            // 1. In wp-config.php, replace placeholders with actual values stored in the settings.
            // - DB: {{DB_NAME}}, {{DB_USER}}, {{DB_PASSWORD}}, {{DB_HOST}}
            // - @TODO: SALT: {{AUTH_KEY}}, {{SECURE_AUTH_KEY}}, {{LOGGED_IN_KEY}}, {{NONCE_KEY}}, {{AUTH_SALT}}, {{SECURE_AUTH_SALT}}, {{LOGGED_IN_SALT}}, {{NONCE_SALT}}
            // 2. Create MySQL DB.
            // - Update admin user with password.

            let app_fs = AppFileSystem::new()?;
            let site_dir = app_fs.sites_dir.join(domain);

            let settings = get_settings().await;

            // #1 - Start
            let wp_config_var_values: &[(&str, &str)] = &[
                ("{{DB_NAME}}", &db_name),
                ("{{DB_USER}}", &settings.mysql_user),
                ("{{DB_PASSWORD}}", &settings.mysql_password),
                ("{{DB_HOST}}", &settings.mysql_host),
                ("{{DB_PORT}}", &settings.mysql_port.to_string()),
            ];
            let wp_config_path = site_dir.join("wp-config.php");
            println!("Creating wp-config.php at: {}", wp_config_path.display());

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

            println!(
                "wp-config.php created successfully with contents:\n{}",
                wp_config_contents
            );
            // #1 - End

            // #2 - Start
            let settings = get_settings().await;
            let mysql_db_name = format!("{}-{}", site_name, site_tld);
            let mysql_db_create_query =
                format!("CREATE DATABASE IF NOT EXISTS `{}`", mysql_db_name);

            // @TODO: Add user creation and password update.
            let mysql_db_user = "lempify";
            let mysql_db_password = "lempify";
            let mysql_db_host = "localhost";
            let _mysql_db_user_create_query = format!(
                "CREATE USER IF NOT EXISTS `{}`@`{}`",
                mysql_db_user, mysql_db_host
            );
            let _mysql_db_user_password_query = format!(
                "SET PASSWORD FOR `{}`@`{}` = PASSWORD('{}')",
                mysql_db_user, mysql_db_host, mysql_db_password
            );
            let _mysql_db_grant_query = format!(
                "GRANT ALL PRIVILEGES ON `{}`.* TO `{}`@`{}`",
                mysql_db_name, mysql_db_user, mysql_db_host
            );
            let _mysql_db_flush_query = "FLUSH PRIVILEGES";

            // Connect to MySQL (installed via brew).
            let conn_str = format!(
                "mysql://{}:{}@{}:{}/",
                settings.mysql_user,
                settings.mysql_password,
                settings.mysql_host,
                settings.mysql_port
            );
            println!("Attempting to connect to MySQL with conn_str: {}", conn_str);

            let pool = Pool::new(conn_str.as_str())
                .map_err(|e| format!("Failed to connect to MySQL: {}", e))?;

            println!("Pool created successfully");

            let mut conn = pool
                .get_conn()
                .map_err(|e| format!("Failed to get MySQL connection: {}", e))?;
            println!("Connection established successfully");

            // Test connection with a simple query
            let test_query = "SELECT VERSION()";
            let version: Option<String> = conn
                .query_first(test_query)
                .map_err(|e| format!("Failed to execute test query: {}", e))?;
            println!("MySQL Version: {:?}", version);

            // Execute queries.
            println!("Creating database: {}", mysql_db_name);
            conn.query_drop(mysql_db_create_query)
                .map_err(|e| format!("Failed to create MySQL DB: {}", e))?;
            println!("Database created successfully");

            // #2 - End

            // Add correct ownership and permissions to `wp-content` directory.
            let wp_content_dir = site_dir.join("wp-content");
            let mut perms = fs::metadata(&wp_content_dir)
                .map_err(|e| format!("Failed to get wp-content directory metadata: {}", e))?
                .permissions();
            
            // Set permissions to 755 (rwxr-xr-x) for wp-content directory
            // This allows the web server to read and write to the directory
            perms.set_readonly(false);
            #[cfg(unix)]
            {
                use std::os::unix::fs::PermissionsExt;
                perms.set_mode(0o755);
            }
            
            fs::set_permissions(&wp_content_dir, perms)
                .map_err(|e| format!("Failed to set wp-content directory permissions: {}", e))?;
            println!("wp-content directory permissions set successfully");

            Ok(())
        }
        _ => Ok(()),
    }
}
