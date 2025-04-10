use crate::models::service::ServiceType;
use crate::utils::service_helpers::{get_brew_formula, install_via_brew};

#[tauri::command]
pub fn install_service(service: ServiceType) -> Result<String, String> {
    let formula = get_brew_formula(&service);
    install_via_brew(formula)?;
    Ok(format!("{} installed", formula))
}
