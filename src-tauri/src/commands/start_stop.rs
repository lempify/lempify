use crate::models::service::{ServiceType, ServiceStatus};
use crate::helpers::brew::{start_service as brew_start, stop_service as brew_stop};
use crate::utils::service_helpers::get_brew_formula;
use crate::commands::service_status::get_service_status;

#[tauri::command]
pub async fn start_service(service: ServiceType) -> Result<ServiceStatus, String> {
    let formula = get_brew_formula(&service);
    brew_start(formula)?;
    Ok(get_service_status(service).await)
}

#[tauri::command]
pub async fn stop_service(service: ServiceType) -> Result<ServiceStatus, String> {
    let formula = get_brew_formula(&service);
    brew_stop(formula)?;
    Ok(get_service_status(service).await)
}
