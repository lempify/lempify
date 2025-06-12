use reqwest;
use std::{fs, io};
use std::fs::File;
use zip;

use shared::dirs::get_lempify_app_dir;

use crate::constants;

pub async fn wordpress(version: &str) -> Result<(), String> {
    let config_dir = get_lempify_app_dir()?;
    // ~/Library/Application Support/Lempify/site-types/wordpress
    let site_type_dir = config_dir.join(constants::SITE_TYPE_WORDPRESS_PATH);

    println!("Installing WordPress to: {:?}", site_type_dir);

    if !site_type_dir.exists() {
        println!("Creating WordPress directory");
        fs::create_dir_all(&site_type_dir)
            .map_err(|e| format!("Failed to create WordPress directory: {}", e))?;
    }

    let wordpress_zip_path = &site_type_dir.join(format!("wordpress-{}.zip", version));
    println!("WordPress zip path: {:?}", wordpress_zip_path);
    let wordpress_zip_url = if version == "latest" {
        format!("{}/latest.zip", constants::WP_ORG_URL)
    } else {
        format!("{}/wordpress-{}.zip", constants::WP_ORG_URL, version)
    };
    println!("WordPress zip URL: {:?}", wordpress_zip_url);
    let wordpress_zip_data = reqwest::get(wordpress_zip_url)
        .await
        .unwrap()
        .bytes()
        .await
        .unwrap();
    // println!("WordPress zip data: {:?}", wordpress_zip_data);

    let _ = fs::write(&wordpress_zip_path, wordpress_zip_data);

    println!("WordPress zip path: {:?}", wordpress_zip_path);

    let mut wordpress_zip = zip::ZipArchive::new(
        File::open(&wordpress_zip_path)
            .map_err(|e| format!("Failed to open WordPress zip: {}", e))?,
    )
    .map_err(|_| "Failed to open WordPress zip".to_string())?;

    // Extract to temporary directory first
    let temp_extract_dir = site_type_dir.join("temp_extract");
    fs::create_dir_all(&temp_extract_dir).map_err(|e| format!("Failed to create temp extraction directory: {}", e))?;

    for i in 0..wordpress_zip.len() {
        let mut file = wordpress_zip.by_index(i).map_err(|e| format!("Failed to get file: {}", e))?;
        let outpath = temp_extract_dir.join(file.name());
        if (&mut file).is_dir() {
            fs::create_dir_all(&outpath).map_err(|e| format!("Failed to create directory: {}", e))?;
        } else {
            if let Some(p) = outpath.parent() {
                if !p.exists() {
                    fs::create_dir_all(&p).map_err(|e| format!("Failed to create directory: {}", e))?;
                }
            }
            let mut outfile = fs::File::create(&outpath).map_err(|e| format!("Failed to create file: {}", e))?;
            io::copy(&mut file, &mut outfile).map_err(|e| format!("Failed to copy file: {}", e))?;
        }
    }

    // Move the wordpress folder contents to the version directory
    let wordpress_extracted_dir = temp_extract_dir.join("wordpress");
    let final_version_dir = site_type_dir.join(version);
    
    if wordpress_extracted_dir.exists() {
        fs::rename(&wordpress_extracted_dir, &final_version_dir)
            .map_err(|e| format!("Failed to move WordPress files to version directory: {}", e))?;
    }

    // Clean up temp directory
    fs::remove_dir_all(&temp_extract_dir).map_err(|e| format!("Failed to cleanup temp directory: {}", e))?;

    // delete the zip file
    fs::remove_file(wordpress_zip_path).map_err(|e| format!("Failed to delete WordPress zip: {}", e))?;

    println!("WordPress zip downloaded: {:?}", wordpress_zip_path);

    Ok(())
}
