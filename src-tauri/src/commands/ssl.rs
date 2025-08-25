use std::collections::HashMap;
use tauri::State;

use crate::helpers::ssl::secure_site;
use crate::models::config::ConfigManager;

#[tauri::command]
pub async fn add_ssl(
    config_manager: State<'_, ConfigManager>,
    domain: String,
) -> Result<HashMap<String, String>, String> {
    secure_site(&domain, &config_manager).await
}
