use tauri_plugin_shell::ShellExt;

use std::fs;
use std::process::Command;
use tauri::Runtime;

use shared::constants::{LEMPIFY_SUDOERS_PATH, SUDOERS_DIR};

#[tauri::command]
pub async fn trust_lempify(_app_handle: tauri::AppHandle) -> Result<String, String> {
    let app_path = std::env::current_exe()
        .map_err(|e| format!("Failed to get executable path: {}", e))?;
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

    #[cfg(target_os = "macos")]
    let output = {
        let script = format!(
            "do shell script \"mv {temp_file} {sudoers_path} && chown root:wheel {sudoers_path} && chmod 440 {sudoers_path}\" with administrator privileges",
            temp_file = temp_file.to_str().unwrap(),
            sudoers_path = LEMPIFY_SUDOERS_PATH
        );
        Command::new("osascript")
            .args(["-e", &script])
            .output()
            .map_err(|e| format!("Failed to execute osascript: {}", e))?
    };

    #[cfg(target_os = "linux")]
    let output = {
        // On Linux, use pkexec
        Command::new("pkexec")
            .args([
                "sh",
                "-c",
                &format!(
                    "mv {temp_file} {sudoers_path} && chown root:root {sudoers_path} && chmod 440 {sudoers_path}",
                    temp_file = temp_file.to_str().unwrap(),
                    sudoers_path = LEMPIFY_SUDOERS_PATH
                ),
            ])
            .output()
            .map_err(|e| format!("Failed to execute pkexec: {}", e))?
    };

    if !output.status.success() {
        return Err(format!(
            "Failed to setup sudoers file: {}",
            String::from_utf8_lossy(&output.stderr)
        ));
    }

    // Try to run a simple sudo command
    let output = Command::new("sudo")
        .arg("echo")
        .arg("Sudo access verified!")
        .output()
        .map_err(|e| format!("Failed to verify sudo access: {}", e))?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

pub async fn verify_sudo_access<R: Runtime>(_app: tauri::AppHandle<R>) -> Result<String, String> {
    // Try to run a simple sudo command
    let output = Command::new("sudo")
        .arg("echo")
        .arg("Sudo access verified!")
        .output()
        .map_err(|e| format!("Failed to verify sudo access: {}", e))?;

    let ls_dir = Command::new("sudo")
        .arg("ls")
        .arg("-lha")
        .arg(SUDOERS_DIR)
        .output()
        .map_err(|e| format!("Failed to verify sudoers file: {}", e))?;

    //println!("ls_dir: {}", String::from_utf8_lossy(&ls_dir.stdout));

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}