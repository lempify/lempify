use crate::ui::browser::log_to_file;
use tauri::command;

#[command]
pub fn log(message: String) {
    log_to_file(&message);
}
