use tauri::command;

#[command]
pub fn is_installed() -> Result<bool, String> {
    
    Ok(true)
}
