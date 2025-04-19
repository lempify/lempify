use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ServiceType {
    Php,
    Mysql,
    Nginx,
}

#[derive(Debug, Clone, Serialize)]
pub struct ServiceStatus {
    pub name: String,
    pub installed: bool,
    pub version: Option<String>,
    pub running: bool,
}

#[derive(Debug, Deserialize)]
pub struct SiteCreatePayload {
    pub domain: String,
    pub ssl: bool,
    pub laravel: bool,
    pub wordpress: bool,
    // pub tld: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct SiteInfo {
    pub name: String,
    pub domain: String,
    pub exists: bool,
    pub in_hosts: bool,
    pub config_path: String,
}

impl SiteInfo {
    pub fn build(
        name: String,
        domain: Option<String>,
        exists: Option<bool>,
        in_hosts: Option<bool>,
        config_path: Option<String>,
    ) -> Self {
        let safe_domain = domain.unwrap_or_else(|| name.clone());
        Self {
            name,
            domain: safe_domain,
            exists: exists.unwrap_or(false),
            in_hosts: in_hosts.unwrap_or(false),
            config_path: config_path.unwrap_or_else(|| String::new()),
        }
    }
}
