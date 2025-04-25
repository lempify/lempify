use crate::error::{LempifyError, Result};
use std::env;

pub fn patch_path() -> Result<()> {
    let path = env::var("PATH").map_err(|e| LempifyError::SystemError(e.to_string()))?;
    let mut paths: Vec<String> = path.split(':').map(|s| s.to_string()).collect();

    let brew_locations = [
        "/opt/homebrew/bin",
        "/opt/homebrew/sbin",
        "/usr/local/bin",
        "/usr/local/sbin",
    ];

    for brew_path in brew_locations.iter() {
        if !paths.contains(&brew_path.to_string()) {
            paths.push(brew_path.to_string());
        }
    }

    let joined = paths.join(":");
    env::set_var("PATH", &joined);

    Ok(())
}

pub fn get_brew_path() -> Result<String> {
    let output = std::process::Command::new("which")
        .arg("brew")
        .output()
        .map_err(|e| LempifyError::SystemError(format!("Failed to locate brew: {}", e)))?;

    if !output.status.success() {
        return Err(LempifyError::SystemError(
            "Homebrew is not installed".to_string(),
        ));
    }

    Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
}
