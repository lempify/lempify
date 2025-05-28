use tauri::command;

use crate::helpers::service_utils::get_brew_formula;
use crate::commands::service_status::get_service_status;
use crate::models::service::{ServiceStatus, ServiceType};
use crate::helpers::php::{ensure_php_socket_path_exists, patch_php_fpm_socket_conf};

use shared::brew;

#[command]
pub async fn start_service(service: ServiceType) -> Result<ServiceStatus, String> {
    if matches!(service, ServiceType::Php) {
        patch_php_fpm_socket_conf()?;
        ensure_php_socket_path_exists()?;
    }
    let formula = get_brew_formula(&service);
    brew::start_service(formula)?;
    Ok(get_service_status(service).await)
}

#[command]
pub async fn stop_service(service: ServiceType) -> Result<ServiceStatus, String> {
    let formula = get_brew_formula(&service);
    brew::stop_service(formula)?;
    Ok(get_service_status(service).await)
}

#[command]
pub async fn restart_service(service: ServiceType) -> Result<ServiceStatus, String> {
    let formula = get_brew_formula(&service);
    brew::stop_service(formula)?;
    brew::start_service(formula)?;
    Ok(get_service_status(service).await)
}
