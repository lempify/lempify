use crate::models::service::ServiceType;
use crate::utils::service_helpers::get_brew_formula;
use crate::helpers::php::{ensure_php_socket_path_exists, patch_php_fpm_socket_conf};

#[tauri::command]
pub async fn repair_service(service: ServiceType) -> Result<String, String> {
    if matches!(service, ServiceType::Php) {
        patch_php_fpm_socket_conf()?;
        ensure_php_socket_path_exists()?;

        
    }
    let formula = get_brew_formula(&service);
    crate::helpers::brew::repair_service(formula)?;
    Ok(format!("Successfully repaired {}", formula))
}
