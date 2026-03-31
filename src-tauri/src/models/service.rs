use std::fmt;

use serde::{Deserialize, Serialize};
use shared;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
#[allow(dead_code)]
pub enum ServiceTypes {
    Php,
    Mysql,
    Nginx,
}

impl fmt::Display for ServiceTypes {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{:?}", self)
    }
}

fn default_php_version() -> String {
    shared::constants::DEFAULT_PHP_VERSION.to_string()
}

#[derive(Debug, Deserialize)]
pub struct SiteCreatePayload {
    pub domain: String,
    // pub tld: String,
    pub site_type: String,
    pub site_name: String,
    pub ssl: bool,
    #[serde(default = "default_php_version")]
    pub php_version: String,
}

#[derive(Debug, Serialize)]
pub struct SiteInfo {
    pub name: String,
    pub domain: String,
    pub exists: bool,
    pub in_hosts: bool,
    pub config_path: String,
    pub is_ssl: bool,
}

impl SiteInfo {
    pub fn build(
        name: String,
        domain: Option<String>,
        exists: Option<bool>,
        in_hosts: Option<bool>,
        config_path: Option<String>,
        is_ssl: Option<bool>,
    ) -> Self {
        let safe_domain = domain.unwrap_or_else(|| name.clone());
        Self {
            name,
            domain: safe_domain,
            exists: exists.unwrap_or(false),
            in_hosts: in_hosts.unwrap_or(false),
            config_path: config_path.unwrap_or_else(|| String::new()),
            is_ssl: is_ssl.unwrap_or(false),
        }
    }
}
