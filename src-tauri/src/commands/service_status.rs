use once_cell::sync::Lazy;
use regex::Regex;

use crate::helpers::service_utils::{get_brew_formula, get_version, get_version_args};
use crate::models::service::{ServiceStatus, ServiceType};

use shared::utils::brew;

/**
 * This regex is used to extract the version from the service output.
 * It matches the version in the following formats:
 * - PHP 8.4.24
 * - Ver 1.23.0
 * - nginx/1.23.0
 */
static VERSION_REGEX: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"(?m)(?:PHP\s+|Ver\s+|nginx/)(?P<version>\d+(?:\.\d+)*)")
        .expect("invalid regex")
});

fn extract_version(input: &str) -> Option<String> {
    VERSION_REGEX
        .captures(input)
        .and_then(|caps| caps.name("version").map(|m| m.as_str().to_owned()))
}

#[tauri::command]
pub async fn get_service_status(service: ServiceType) -> ServiceStatus {
    let bin = get_brew_formula(&service);
    let installed = brew::is_service_installed(bin);
    let version = if installed {
        let (args, use_stderr) = get_version_args(&service);
        get_version(bin, args, use_stderr).ok()
    } else {
        None
    };

    let service_status = ServiceStatus {
        name: bin.to_string(),
        running: brew::is_service_running(bin),
        version: version.as_deref().and_then(extract_version).or_else(|| Some("".to_string())),
        installed,
    };

    println!("Service status: {:?}", &service_status);

    service_status
}
