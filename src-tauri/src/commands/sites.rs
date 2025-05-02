use tauri::command;

use crate::{
    helpers::ssl::has_ssl,
    models::service::SiteInfo,
};

use shared::utils::paths;

#[command]
pub fn list_sites() -> Result<Vec<SiteInfo>, String> {
    let sites_dir = paths::get_sites()?;
    let nginx_dir = paths::get_nginx()?;
    let hosts = std::fs::read_to_string("/etc/hosts").unwrap_or_default();

    let mut sites = vec![];

    if sites_dir.exists() {
        for entry in
            std::fs::read_dir(sites_dir).map_err(|e| format!("Failed to read sites dir: {}", e))?
        {
            if let Ok(site) = entry {
                let site_name = site.file_name().to_string_lossy().to_string();

                if site_name.starts_with('.') {
                    continue;
                }

                let domain = format!("{}", site_name);
                let config_path = nginx_dir.join(format!("{}.conf", site_name));
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
                    Some(has_ssl(&domain).unwrap_or(false)),
                );

                sites.push(info);
            }
        }
    }

    Ok(sites)
}
