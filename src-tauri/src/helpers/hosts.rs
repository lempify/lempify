use std::fs;

use crate::helpers::constants::HOSTS_PATH;

pub fn _list_host_entries() -> Result<Vec<String>, String> {
    let contents = fs::read_to_string(HOSTS_PATH)
        .map_err(|e| format!("Failed to read hosts file: {}", e))?;

    Ok(contents
        .lines()
        .filter(|line| !line.trim_start().starts_with('#') && !line.trim().is_empty())
        .map(String::from)
        .collect())
}

pub fn add_host_entry(domain: &str, ip: &str) -> Result<(), String> {
    let entry = format!("{ip} {domain}");

    let contents = fs::read_to_string(HOSTS_PATH)
        .map_err(|e| format!("Failed to read hosts file: {}", e))?;

    if contents.contains(&entry) {
        return Ok(()); // Already exists
    }

    // macOS-specific sudo prompt
    if cfg!(target_os = "macos") {
        let script = format!(
            r#"do shell script "echo '{}' | sudo tee -a {}" with administrator privileges"#,
            entry, HOSTS_PATH
        );

        let status = std::process::Command::new("osascript")
            .arg("-e")
            .arg(script)
            .status()
            .map_err(|e| format!("osascript failed: {}", e))?;

        if status.success() {
            return Ok(());
        } else {
            return Err("osascript failed or user denied permissions".into());
        }
    }

    Err("Adding host entries is not implemented for this OS yet.".into())
}

pub fn remove_host_entry(domain: &str) -> Result<(), String> {
    let contents = fs::read_to_string(HOSTS_PATH)
        .map_err(|e| format!("Failed to read hosts file: {}", e))?;

    let filtered: Vec<_> = contents
        .lines()
        .filter(|line| !line.contains(domain))
        .map(|l| l.to_string())
        .collect();

    let new_contents = filtered.join("\n");

    if cfg!(target_os = "macos") {
        let script = format!(
            r#"do shell script "echo '{}' | sudo tee {}" with administrator privileges"#,
            new_contents.replace('"', "\\\""),
            HOSTS_PATH
        );

        let status = std::process::Command::new("osascript")
            .arg("-e")
            .arg(script)
            .status()
            .map_err(|e| format!("osascript failed: {}", e))?;

        if status.success() {
            return Ok(());
        } else {
            return Err("osascript failed or user denied permissions".into());
        }
    }

    Err("Removing host entries is not implemented for this OS yet.".into())
}
