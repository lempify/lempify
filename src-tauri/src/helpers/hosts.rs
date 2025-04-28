use std::fs;

use crate::helpers::constants::HOSTS_PATH;
use crate::helpers::osascript;

pub fn _list_host_entries() -> Result<Vec<String>, String> {
    let contents =
        fs::read_to_string(HOSTS_PATH).map_err(|e| format!("Failed to read hosts file: {}", e))?;

    Ok(contents
        .lines()
        .filter(|line| !line.trim_start().starts_with('#') && !line.trim().is_empty())
        .map(String::from)
        .collect())
}

pub fn add_host_entry(domain: &str, ip: &str) -> Result<(), String> {
    let entry = format!("{ip} {domain}");

    let contents =
        fs::read_to_string(HOSTS_PATH).map_err(|e| format!("Failed to read hosts file: {}", e))?;

    if contents.contains(&entry) {
        return Ok(()); // Already exists
    }

    // macOS-specific sudo prompt
    if cfg!(target_os = "macos") {
        return Ok(osascript::run(
            &format!("echo '{}' | sudo tee -a {}", entry, HOSTS_PATH),
            Some(&format!(
                "Lempify needs permission to add {} to your hosts file.",
                domain
            )),
        )?);
    }

    Err("Adding host entries is not implemented for this OS yet.".into())
}

pub fn remove_host_entry(domain: &str) -> Result<(), String> {
    let contents =
        fs::read_to_string(HOSTS_PATH).map_err(|e| format!("Failed to read hosts file: {}", e))?;

    let filtered: Vec<_> = contents
        .lines()
        .filter(|line| !line.contains(domain))
        .map(|l| l.to_string())
        .collect();

    let new_contents = filtered.join("\n");

    if cfg!(target_os = "macos") {
        return Ok(osascript::run(
            &format!(
                "echo '{}' | sudo tee {}",
                new_contents.replace('"', "\\\""),
                HOSTS_PATH
            ),
            Some(&format!(
                "Lempify needs permission to remove {} from your hosts file.",
                domain
            )),
        )?);
    }

    Err("Removing host entries is not implemented for this OS yet.".into())
}

pub fn is_host_entry_exists(domain: &str) -> Result<bool, String> {
    let contents =
        fs::read_to_string(HOSTS_PATH).map_err(|e| format!("Failed to read hosts file: {}", e))?;

    Ok(contents.contains(domain))
}
