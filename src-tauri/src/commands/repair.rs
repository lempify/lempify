use crate::models::service::ServiceType;
use crate::utils::service_helpers::get_brew_formula;

#[tauri::command]
pub async fn repair_service(service: ServiceType) -> Result<String, String> {
    let formula = get_brew_formula(&service);
    crate::helpers::brew::repair_service(formula)?;
    Ok(format!("Successfully repaired {}", formula))
}
