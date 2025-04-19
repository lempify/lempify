use crate::helpers::brew::is_service_running;
use crate::helpers::service::{get_brew_formula, get_version, get_version_args, is_installed};
use crate::models::service::{ServiceStatus, ServiceType};

#[tauri::command]
pub async fn get_service_status(service: ServiceType) -> ServiceStatus {
    let bin = get_brew_formula(&service);
    let installed = is_installed(bin).unwrap_or(false);
    let version = if installed {
        let (args, use_stderr) = get_version_args(&service);
        get_version(bin, args, use_stderr).ok()
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
