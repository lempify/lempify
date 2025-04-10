use crate::models::service::{ServiceType, ServiceStatus};
use crate::helpers::brew::is_service_running;
use crate::utils::service_helpers::{get_brew_formula, get_version_args, get_version, is_installed};

#[tauri::command]
pub async fn get_service_status(service: ServiceType) -> ServiceStatus {
    let bin = get_brew_formula(&service);
    let installed = is_installed(bin);
    let version = if installed {
        let (args, use_stderr) = get_version_args(&service);
        get_version(bin, args, use_stderr)
    } else {
        None
    };

    let running = is_service_running(bin);

    ServiceStatus {
        name: bin.to_string(),
        installed,
        version,
        running,
    }
}
