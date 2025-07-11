use std::collections::HashMap;
use tauri::State;

use crate::models::config::ConfigManager;
use crate::helpers::ssl::secure_site;

#[tauri::command]
pub async fn add_ssl(
    config_manager: State<'_, ConfigManager>,
    domain: String,
) -> Result<HashMap<String, String>, String> {
    secure_site(&domain, &config_manager).await
}
