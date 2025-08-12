use std::collections::HashMap;

use shared::{brew, file_system::AppFileSystem, osascript, ssl, utils_legacy};

use crate::models::config::ConfigManager;

pub async fn secure_site(domain: &str, config_manager: &ConfigManager) -> Result<HashMap<String, String>, String> {
    // @TODO move to function
    if !utils_legacy::is_bin_installed("mkcert").unwrap_or(false) {
        crate::helpers::service_utils::install_via_brew("mkcert")
            .map_err(|e| format!("Failed to install mkcert: {}", e))?;
        let output = std::process::Command::new("mkcert")
            .arg("-CAROOT")
            .output()
            .ok();

        if let Some(out) = output {
            let ca_path = String::from_utf8_lossy(&out.stdout).trim().to_string();
            if !std::path::Path::new(&format!("{}/rootCA.pem", ca_path)).exists() {
                osascript::run(
                    "/opt/homebrew/bin/mkcert -install",
                    Some("Lempify needs permission to install mkcert. Please enter your macOS password.")
                )?;
            }
        }
    }

    let certs = ssl::secure_site(domain)?;

    let certs_dir = AppFileSystem::new()?.certs_dir;
    
    config_manager.with_config(|config| {
        if let Some(site) = config.sites.iter_mut().find(|site| site.domain == domain) {
            site.ssl = true;
            site.site_config.ssl = true;
            site.site_config.ssl_key = Some(format!("{}/{}-key.pem", certs_dir.display(), domain));
            site.site_config.ssl_cert = Some(format!("{}/{}.pem", certs_dir.display(), domain));
        }
        Ok(())
    }).await?;

    // Restart nginx.
    brew::restart_service("nginx")?;

    Ok(certs)
}
