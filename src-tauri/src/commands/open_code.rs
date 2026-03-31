use std::{
    process::{Command},
};

#[tauri::command]
pub async fn open_code(path: String) -> Result<(), String> {
    Command::new("code")
            .arg(&path)
            .spawn()
            .expect("Failed to open VS Code");

    Ok(())
}
