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
            on_complete: None,
        }
    }

    pub fn on_complete<F>(mut self, callback: F) -> Self
    where
        F: FnOnce() -> Result<(), String> + 'static,
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
                Some(
                    "Lempify needs permission to run this script. Please enter your macOS password.",
                ),
            )?;
            if let Some(callback) = self.on_complete {
                callback()?;
            }
            Ok(())
        }
    }
}

/// Specialized command for file operations that require elevated permissions
pub struct FileSudoCommand {
    operation: FileOperation,
    target_path: std::path::PathBuf,
    content: Option<String>,
    temp_file: Option<std::path::PathBuf>,
}

enum FileOperation {
    Write,
    Remove,
}

impl FileSudoCommand {
    pub fn write(content: String, target_path: std::path::PathBuf) -> Self {
        Self {
            operation: FileOperation::Write,
            target_path,
            content: Some(content),
            temp_file: None,
        }
    }

    pub fn remove(target_path: std::path::PathBuf) -> Self {
        Self {
            operation: FileOperation::Remove,
            target_path,
            content: None,
            temp_file: None,
        }
    }

    pub fn run(self) -> Result<(), String> {
        match self.operation {
            FileOperation::Write => self.run_write(),
            FileOperation::Remove => self.run_remove(),
        }
    }

    fn run_write(mut self) -> Result<(), String> {
        let content = self
            .content
            .take()
            .ok_or("No content provided for write operation")?;

        // Create temp file
        let temp_file = std::env::temp_dir().join(format!(
            "lempify-{}",
            self.target_path
                .file_name()
                .and_then(|n| n.to_str())
                .unwrap_or("temp")
        ));

        std::fs::write(&temp_file, content)
            .map_err(|e| format!("Failed to write temporary file: {}", e))?;

        self.temp_file = Some(temp_file.clone());

        let temp_path = temp_file.to_str().unwrap();
        let target_path_str = self.target_path.to_str().unwrap();

        if sudoers_exists() {
            // Use sudo directly
            let output = std::process::Command::new("sudo")
                .args(["mv", temp_path, target_path_str])
                .output()
                .map_err(|e| format!("Failed to run sudo: {}", e))?;

            if !output.status.success() {
                return Err(format!(
                    "Failed to write file: {}",
                    String::from_utf8_lossy(&output.stderr)
                ));
            }
        } else {
            // Fall back to osascript for admin privileges
            #[cfg(target_os = "macos")]
            {
                let script = format!(
                    "mv {temp_file} {target_path}",
                    temp_file = temp_path,
                    target_path = target_path_str
                );
                osascript::run(
                    &script,
                    Some(
                        "Lempify needs permission to write configuration file. Please enter your macOS password.",
                    ),
                )?;
            }

            // #[cfg(target_os = "linux")]
            // {
            // }
        }

        Ok(())
    }

    fn run_remove(self) -> Result<(), String> {
        if !self.target_path.exists() {
            return Ok(());
        }

        let target_path_str = self.target_path.to_str().unwrap();

        if sudoers_exists() {
            // Use sudo directly
            let output = std::process::Command::new("sudo")
                .args(["rm", target_path_str])
                .output()
                .map_err(|e| format!("Failed to run sudo: {}", e))?;

            if !output.status.success() {
                return Err(format!(
                    "Failed to remove file: {}",
                    String::from_utf8_lossy(&output.stderr)
                ));
            }
        } else {
            // Fall back to osascript for admin privileges
            #[cfg(target_os = "macos")]
            {
                let script = format!("rm {target_path}", target_path = target_path_str);
                osascript::run(
                    &script,
                    Some(
                        "Lempify needs permission to remove configuration file. Please enter your macOS password.",
                    ),
                )?;
            }

            #[cfg(target_os = "linux")]
            {
                let output = std::process::Command::new("pkexec")
                    .args([
                        "sh",
                        "-c",
                        &format!("rm {target_path}", target_path = target_path_str),
                    ])
                    .output()
                    .map_err(|e| format!("Failed to execute pkexec: {}", e))?;

                if !output.status.success() {
                    return Err(format!(
                        "Failed to remove file: {}",
                        String::from_utf8_lossy(&output.stderr)
                    ));
                }
            }
        }

        Ok(())
    }
}

impl Drop for FileSudoCommand {
    fn drop(&mut self) {
        // Clean up temp file if it still exists
        if let Some(temp_file) = &self.temp_file {
            if temp_file.exists() {
                let _ = std::fs::remove_file(temp_file);
            }
        }
    }
}
