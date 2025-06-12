use crate::helpers::utils;
use crate::models::service::{ServiceStatus, ServiceType};

#[tauri::command]
pub async fn get_service_status(service: ServiceType) -> ServiceStatus {
    return utils::get_service_status(service).await;
}
