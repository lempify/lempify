use std::fs;

use crate::{constants::HOSTS_PATH, utils::SudoCommand};

/**
 * List all host entries from the hosts file.
 *
 * @example
 * ```
 * let entries = hosts::list_entries();
 * println!("{:?}", entries);
 * ```
 */
pub fn list_entries() -> Result<Vec<String>, String> {
    let contents =
        fs::read_to_string(HOSTS_PATH)
            .map_err(|e| format!("Failed to read hosts file: {}", e))?;

    Ok(contents
        .lines()
        .filter(|line| !line.trim_start().starts_with('#') && !line.trim().is_empty())
        .map(String::from)
        .collect())
}

/**
 * Add a host entry to the hosts file.
 *
 * @example
 * ```
 * hosts::add_entry("example.com", "127.0.0.1");
 * ```
 */
pub fn add_entry(domain: &str) -> Result<(), String> {
    let entry = format!("127.0.0.1 {}", domain);
    let contents =
        fs::read_to_string(HOSTS_PATH).map_err(|e| format!("Failed to read hosts file: {}", e))?;

    if contents.lines().any(|line| {
        let trimmed = line.trim();
        !trimmed.starts_with('#') && trimmed == entry
    }) {
        return Ok(());
    }

    let mut lines: Vec<String> = contents.lines().map(|s| s.to_string()).collect();
    let flag = "# Lempify";

    if let Some(lempify_index) = lines.iter().position(|line| line.trim() == flag) {
        lines.insert(lempify_index + 1, entry);
    } else {
        if !lines.is_empty() && !lines.last().unwrap().is_empty() {
            lines.push(String::new());
        }
        lines.push(flag.to_string());
        lines.push(entry);
    }

    let new_contents = lines.join("\n");

    let temp_file = std::env::temp_dir().join("lempify_hosts_update");
    fs::write(&temp_file, new_contents).map_err(|e| format!("Failed to write temp file: {}", e))?;

    let temp_file_str = temp_file.to_str().unwrap();
    let temp_file_path = temp_file_str.to_string();
    SudoCommand::new(
        vec!["cp", temp_file_str, HOSTS_PATH],
        &format!("cp {} {}", temp_file_str, HOSTS_PATH),
    )
    .on_complete(move || {
        let _ = fs::remove_file(&temp_file_path);
        Ok(())
    })
    .run()?;

    Ok(())
}

/**
 * Remove a host entry from the hosts file.
 * @example
 * ```
 * hosts::remove_entry("example.com");
 * ```
 */
pub fn remove_entry(domain: &str) -> Result<(), String> {
    let contents =
        fs::read_to_string(HOSTS_PATH).map_err(|e| format!("Failed to read hosts file: {}", e))?;

    let filtered: Vec<_> = contents
        .lines()
        .filter(|line| !line.contains(domain))
        .map(|l| l.to_string())
        .collect();

    let new_contents = filtered.join("\n");

    let temp_file = std::env::temp_dir().join("lempify_hosts_remove");
    fs::write(&temp_file, new_contents)
        .map_err(|e| format!("Failed to write temp file: {}", e))?;

    let temp_file_str = temp_file.to_str().unwrap();
    let temp_file_path = temp_file_str.to_string();

    SudoCommand::new(
        vec!["cp", temp_file_str, HOSTS_PATH],
        &format!("cp {} {}", temp_file_str, HOSTS_PATH),
    )
    .on_complete(move || {
        let _ = fs::remove_file(&temp_file_path);
        Ok(())
    })
    .run()?;

    Ok(())
}

/**
 * Check if a host entry exists in the hosts file.
 * @param domain: The domain to check
 * @returns: Result<bool, String>
 * @example
 * ```
 * hosts::entry_exists("example.com");
 * ```
 */
pub fn entry_exists(domain: &str) -> Result<bool, String> {
    let contents =
        fs::read_to_string(HOSTS_PATH).map_err(|e| format!("Failed to read hosts file: {}", e))?;

    Ok(contents.lines().any(|line| {
        let trimmed = line.trim();
        if trimmed.is_empty() || trimmed.starts_with('#') {
            return false;
        }

        let parts: Vec<&str> = trimmed.split_whitespace().collect();
        if parts.len() >= 2 {
            parts[1..].contains(&domain)
        } else {
            false
        }
    }))
}
