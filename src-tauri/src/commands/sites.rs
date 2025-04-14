use tauri::command;

use crate::models::service::SiteInfo;

#[command]
pub fn list_sites() -> Result<Vec<SiteInfo>, String> {
    let home = dirs::home_dir().ok_or("Unable to get home directory")?;
    let sites_dir = home.join("Lempify/sites");
    let nginx_dir = home.join("Lempify/nginx");
    let hosts = std::fs::read_to_string("/etc/hosts").unwrap_or_default();

    let mut sites = vec![];

    if sites_dir.exists() {
        for entry in std::fs::read_dir(sites_dir).map_err(|e| format!("Failed to read sites dir: {}", e))? {
            if let Ok(site) = entry {
                let site_name = site.file_name().to_string_lossy().to_string();

                if site_name.starts_with('.') {
                    continue;
                }

                let domain = format!("{}.test", site_name);
                let config_path = nginx_dir.join(format!("{}.conf", site_name));

                let info = SiteInfo {
                    name: site_name.clone(),
                    domain: domain.clone(),
                    exists: site.path().exists(),
                    in_hosts: hosts.contains(&domain),
                    config_path: config_path.display().to_string(),
                };

                sites.push(info);
            }
        }
    }

    Ok(sites)
}
