use serde::{Serialize, Deserialize};

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
    pub name: String,
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