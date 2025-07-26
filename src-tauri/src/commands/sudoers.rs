use std::fs;
use std::process::Command;

use crate::models::config::{Config, ConfigManager};
use shared::constants::LEMPIFY_SUDOERS_PATH;
use tauri::State;

use shared::osascript;

#[tauri::command]
pub async fn trust_lempify(config_manager: State<'_, ConfigManager>) -> Result<Config, String> {
    let app_path =
        std::env::current_exe().map_err(|e| format!("Failed to get executable path: {}", e))?;
    let app_path_str = app_path.to_str().ok_or("Invalid app path")?;

    let username = Command::new("whoami")
        .output()
        .map_err(|e| format!("Failed to get username: {}", e))?;
    let username = String::from_utf8_lossy(&username.stdout).trim().to_string();

    let sudoers_content = format!(
        "# Allow {} to run sudo commands without password\n\
         {} ALL=(ALL) NOPASSWD: ALL\n",
        app_path_str, username
    );

    let temp_file = std::env::temp_dir().join("tauri-sudoers");
    fs::write(&temp_file, sudoers_content)
        .map_err(|e| format!("Failed to write temporary file: {}", e))?;

    osascript::run(
        &format!(
            "mv {temp_file} {sudoers_path} && chown root:wheel {sudoers_path} && chmod 440 {sudoers_path}",
            temp_file = temp_file.to_str().unwrap(),
            sudoers_path = LEMPIFY_SUDOERS_PATH
        ),
        Some("Lempify needs permission to perform Trust Handshake. Please enter your macOS password."),
    ).map_err(|e| format!("Failed to execute osascript: {}", e))?;

    // Try to run a simple sudo command
    let output = Command::new("sudo")
        .arg("echo")
        .arg("Sudo access verified!")
        .output()
        .map_err(|e| format!("Failed to verify sudo access: {}", e))?;

    config_manager.set_trusted(true).await?;

    if output.status.success() {
        let config = config_manager.get_config().await;
        Ok(config)
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
pub async fn untrust_lempify(config_manager: State<'_, ConfigManager>) -> Result<Config, String> {
    let sudoers_path = LEMPIFY_SUDOERS_PATH;

    #[cfg(target_os = "macos")]
    let output = {
        let script = format!("do shell script \"rm {sudoers_path}\" with administrator privileges");
        Command::new("osascript")
            .args(["-e", &script])
            .output()
            .map_err(|e| format!("Failed to execute osascript: {}", e))?
    };

    #[cfg(target_os = "linux")]
    let output = {
        Command::new("pkexec")
            .args(["sh", "-c", &format!("rm {sudoers_path}")])
            .output()
            .map_err(|e| format!("Failed to execute pkexec: {}", e))?
    };

    if !output.status.success() {
        return Err(format!(
            "Failed to remove sudoers file: {}",
            String::from_utf8_lossy(&output.stderr)
        ));
    }

    config_manager.set_trusted(false).await?;

    let config = config_manager.get_config().await;

    Ok(config)
}
