use tauri::command;
use crate::ui::browser::log_to_file;

#[command]
pub fn log(message: String) {
    log_to_file(&message);
} 