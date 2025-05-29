use shared::{ssl, utils, osascript};

pub fn secure_site(domain: &str) -> Result<(), String> {
    println!("secure_site: {}", domain);
    if !utils::is_bin_installed("mkcert").unwrap_or(false) {
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

    ssl::secure_site(domain)
}
