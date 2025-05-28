use std::process::Command;

use crate::{constants::LEMPIFY_SUDOERS_PATH, osascript};

pub fn is_bin_installed(bin: &str) -> Result<bool, String> {
    let status = Command::new("which")
        .arg(bin)
        .output()
        .map_err(|e| format!("Failed to check if {} is installed: {}", bin, e))?
        .status
        .success();

    Ok(status)
}

/**
 * Check if the sudoers file exists
 * @returns: bool
 */
pub fn sudoers_exists() -> bool {
    std::path::Path::new(LEMPIFY_SUDOERS_PATH).exists()
}

pub struct SudoCommand<'a> {
    command: Vec<&'a str>,
    osascript_command: &'a str,
    on_complete: Option<Box<dyn FnOnce() -> Result<(), String>>>,
}

impl<'a> SudoCommand<'a> {
    pub fn new(command: Vec<&'a str>, osascript_command: &'a str) -> Self {
        Self { 
            command, 
            osascript_command, 
            on_complete: None 
        }
    }
    
    pub fn on_complete<F>(mut self, callback: F) -> Self 
    where 
        F: FnOnce() -> Result<(), String> + 'static 
    {
        self.on_complete = Some(Box::new(callback));
        self
    }
    
    pub fn run(self) -> Result<(), String> {
        if sudoers_exists() {
            let status = Command::new("sudo")
                .args(self.command)
                .output()
                .map_err(|e| format!("Failed to run sudo: {}", e))?
                .status;

            if status.success() {
                if let Some(callback) = self.on_complete {
                    callback()?;
                }
                Ok(())
            } else {
                Err(format!("Failed to run sudo: {}", status))
            }
        } else {
            osascript::run(
                self.osascript_command,
                Some("Lempify needs permission to run this script. Please enter your macOS password."),
            )?;
            if let Some(callback) = self.on_complete {
                callback()?;
            }
            Ok(())
        }
    }
}
