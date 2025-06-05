use tauri::command;

use crate::models::service::SiteInfo;

use shared::{constants::HOSTS_PATH, dirs, ssl};

#[command]
pub fn list_sites() -> Result<Vec<SiteInfo>, String> {
    let sites_dir = dirs::get_sites()?;
    let nginx_sites_enabled_dir = dirs::get_nginx_sites_enabled()?;
    let hosts = std::fs::read_to_string(HOSTS_PATH).unwrap_or_default();

    let mut sites = vec![];

    if sites_dir.exists() {
        for entry in
            std::fs::read_dir(sites_dir).map_err(|e| format!("Failed to read sites dir: {}", e))?
        {
            if let Ok(site) = entry {
                let site_name = site.file_name().to_string_lossy().to_string();

                // Excude /opt/homebrew/var/www/index.html & /opt/homebrew/var/www/50x.html in brew installs
                if site_name.starts_with('.') || site_name.ends_with(".html") {
                    continue;
                }

                let domain = format!("{}", site_name);
                let config_path = nginx_sites_enabled_dir.join(format!("{}.conf", site_name));
                let in_hosts = hosts.contains(&domain);
                let config_path_str = if config_path.exists() {
                    config_path.display().to_string()
                } else {
                    String::new()
                };

                let info = SiteInfo::build(
                    site_name,
                    Some(domain.to_string()),
                    Some(site.path().exists()),
                    Some(in_hosts),
                    Some(config_path_str),
                    Some(ssl::has_ssl(&domain).unwrap_or(false)),
                );

                sites.push(info);
            }
        }
    }

    Ok(sites)
}
