use tauri::command;
use crate::helpers::ssl::secure_site;

#[command]
pub async fn add_ssl(domain: &str) -> Result<(), String> {
    secure_site(domain)
}
