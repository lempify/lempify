use std::collections::HashMap;
use tauri::State;

use shared::validate::validate_domain;

use crate::helpers::ssl::secure_site;
use crate::models::config::ConfigManager;

#[tauri::command]
pub async fn add_ssl(
    config_manager: State<'_, ConfigManager>,
    domain: String,
) -> Result<HashMap<String, String>, String> {
    // Validate before the domain reaches mkcert and the privileged nginx write.
    validate_domain(&domain)?;

    secure_site(&domain, &config_manager).await
}
