use crate::error::{LempifyError, Result};
use crate::models::service::ServiceType;

use shared::brew;

pub fn get_brew_formula(service: &ServiceType) -> &'static str {
    match service {
        ServiceType::Php => "php",
        ServiceType::Mysql => "mysql",
        ServiceType::Nginx => "nginx",
    }
}

pub fn get_version_args(service: &ServiceType) -> (&'static [&'static str], bool) {
    match service {
        ServiceType::Php => (&["-v"], false),
        ServiceType::Mysql => (&["--version"], false),
        ServiceType::Nginx => (&["-v"], true),
    }
}

pub fn install_via_brew(formula: &str) -> Result<()> {
    brew::install_service(formula)
        .map_err(|e| LempifyError::InstallationError(format!("Failed to install {}: {}", formula, e)))
}
