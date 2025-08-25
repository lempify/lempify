use tauri::{command, State};

use crate::models::config::ConfigManager;

#[command]
pub async fn set_installed(config_manager: State<'_, ConfigManager>) -> Result<(), String> {
    config_manager.set_installed(true).await?;
    Ok(())
}
