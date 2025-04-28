use crate::helpers::nginx::{restart_nginx, update_nginx_config_with_ssl};
use crate::helpers::paths::get_certs_dir;
use crate::helpers::service_utils::install_via_brew;
use std::fs;
use std::path::Path;
use std::process::Command;

use crate::helpers::osascript;
use crate::helpers::service_utils::is_installed;

pub fn secure_site(domain: &str) -> Result<(), String> {
    if !is_installed("mkcert").unwrap_or(false) {
        println!("MkCert not installed, installing...");
        install_via_brew("mkcert").map_err(|e| format!("Failed to install mkcert: {}", e))?;

        println!("MkCert installed, installing CA...");
        let output = Command::new("mkcert").arg("-CAROOT").output().ok();

        if let Some(out) = output {
            println!("MkCert installed, installing CA...");
            let ca_path = String::from_utf8_lossy(&out.stdout).trim().to_string();
            if !Path::new(&format!("{}/rootCA.pem", ca_path)).exists() {
                println!("Installing CA...");
                osascript::run(
                    "/opt/homebrew/bin/mkcert -install",
                    Some("Lempify needs permission to install mkcert. Please enter your macOS password.")
                )?;
            }
        }
    }

    let certs_dir = get_certs_dir()?;

    if !certs_dir.exists() {
        fs::create_dir_all(&certs_dir)
            .map_err(|e| format!("Failed to create certs directory: {}", e))?;
    }

    let cert_path = certs_dir.join(format!("{domain}.pem"));
    let key_path = certs_dir.join(format!("{domain}-key.pem"));

    // Avoid regenerating if certs already exist
    if !(cert_path.exists() && key_path.exists()) {
        println!("Generating certs for {} via mkcert", domain);

        let status = Command::new("mkcert")
            .current_dir(&certs_dir)
            .arg(domain)
            .status()
            .map_err(|e| format!("Failed to spawn mkcert: {}", e))?;

        if !status.success() {
            return Err(format!("Failed to generate certs for {}", domain));
        }
    } else {
        println!("Certs already exist for {}", domain);
    }

    update_nginx_config_with_ssl(domain)?;

    restart_nginx()?;

    Ok(())
}

pub fn has_ssl(domain: &str) -> Result<bool, String> {
    let certs_dir = get_certs_dir()?;
    let cert_path = certs_dir.join(format!("{domain}.pem"));
    let key_path = certs_dir.join(format!("{domain}-key.pem"));
    Ok(cert_path.exists() && key_path.exists())
}
