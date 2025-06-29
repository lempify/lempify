use std::collections::HashMap;

use crate::helpers::ssl::secure_site;
use tauri::command;

#[command]
pub async fn add_ssl(domain: &str) -> Result<HashMap<String, String>, String> {
    secure_site(domain).await
}
