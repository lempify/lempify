use std::path::PathBuf;
use std::process::{Command, Stdio};

use crate::utils::is_bin_installed;

pub struct BrewCommand<'a> {
    args: Vec<&'a str>,
    sudo: bool,
}

impl<'a> BrewCommand<'a> {
    pub fn new(args: &[&'a str]) -> Self {
        Self {
            args: args.to_vec(),
            sudo: false,
        }
    }

    pub fn sudo(mut self) -> Self {
        self.sudo = true;
        self
    }

    pub fn run(self) -> Result<String, String> {
        let mut command = Command::new(if self.sudo { "sudo" } else { "brew" });

        if self.sudo {
            command.arg("brew");
        }

        let output = command
            .args(&self.args)
            .output()
            .map_err(|e| format!("Failed to execute brew command: {}", e))?;

        if output.status.success() {
            String::from_utf8(output.stdout)
                .map_err(|e| format!("Failed to parse command output: {}", e))
        } else {
            Err(format!(
                "brew command failed: {}\n{}",
                self.args.join(" "),
                String::from_utf8_lossy(&output.stderr)
            ))
        }
    }
}

// @TODO: Add to config.json during setup.
// @TODO: Apply to instances of `/opt/homebrew`
pub fn get_path_prefix() -> Result<String, String> {
    BrewCommand::new(&["--prefix"]).run()
}

/**
 * Check if Brew is installed
 */
pub fn is_installed() -> bool {
    // Command::new("brew").output().is_ok()
    is_bin_installed("brew").unwrap_or(false)
}

/**
 * Get version of installed binary
 */
pub fn get_binary_version(bin: &str, args: &[&str], use_stderr: bool) -> Result<String, String> {
    let output = Command::new(bin)
        .args(args)
        .stderr(Stdio::piped())
        .stdout(Stdio::piped())
        .output()
        .map_err(|e| format!("Failed to get version for {}: {}", bin, e))?;

    if !output.status.success() {
        return Err(format!("Failed to get version for {}", bin));
    }

    let output_str = if use_stderr {
        String::from_utf8_lossy(&output.stderr)
    } else {
        String::from_utf8_lossy(&output.stdout)
    };

    Ok(output_str.trim().to_string())
}

/**
 * Install Brew if not installed
 */
pub fn install() -> Result<(), String> {
    Err("Install brew not implemented yet!".to_string())
}

/**
 * Check if a service is running
 */
fn check_service_status(service: &str, status: &str) -> bool {
    Command::new("brew")
        .arg("services")
        .arg("list")
        .output()
        .map_or(false, |output| {
            let output_str = String::from_utf8_lossy(&output.stdout);
            output_str
                .lines()
                .any(|line| line.contains(service) && line.contains(status))
        })
}

/**
 * Install a service
 */
pub fn install_service(service: &str) -> Result<(), String> {
    // Install the formula
    BrewCommand::new(&["install", service]).run()?;

    // Link the formula
    BrewCommand::new(&["link", &service, "--overwrite", "--force"]).run()?;

    Ok(())
}

/**
 * Check if a service is installed
 */
pub fn is_service_installed(bin: &str) -> bool {
    Command::new("brew")
        .arg("services")
        .arg("list")
        .output()
        .map_or(false, |output| {
            let output_str = String::from_utf8_lossy(&output.stdout);
            output_str.lines().any(|line| line.contains(bin))
        })
}

/**
 * Check if a service is running
 */
pub fn is_service_running(bin: &str) -> bool {
    check_service_status(bin, "started")
}

/**
 * Start a service
 */
pub fn start_service(service: &str) -> Result<(), String> {
    BrewCommand::new(&["services", "start", service]).run()?;
    Ok(())
}

/**
 * Stop a service
 */
pub fn stop_service(service: &str) -> Result<(), String> {
    match BrewCommand::new(&["services", "stop", service]).run() {
        Ok(_) => Ok(()),
        Err(_) => {
            eprintln!("brew failed to stop {}; trying launchctl fallback", service);
            stop_service_fallback(service)
        }
    }
}

pub fn repair_service(service: &str) -> Result<(), String> {
    //println!("Repairing service: {}", service);

    // Try to stop it gracefully
    let _ = stop_service(service); // Ignore errors, we're gonna nuke it anyway

    // Remove the .plist if it still exists
    let _ = get_launch_agent_path(service).map(|path| {
        if path.exists() {
            std::fs::remove_file(&path).ok();
        }
    });

    // Cleanup broken launchd state
    BrewCommand::new(&["services", "cleanup"]).run()?;

    // Reinstall the service (force)
    BrewCommand::new(&["reinstall", service]).run()?;

    // Start the service fresh
    start_service(service)?;

    Ok(())
}

/**
 * Stop a service fallback
 */
fn stop_service_fallback(service: &str) -> Result<(), String> {
    let plist_path = get_launch_agent_path(service)?;
    let uid = users::get_current_uid();
    let target = format!("gui/{}", uid);

    Command::new("launchctl")
        .arg("bootout")
        .arg(&target)
        .arg(plist_path)
        .status()
        .map_err(|e| format!("launchctl bootout failed: {}", e))
        .and_then(|status| {
            if status.success() {
                Ok(())
            } else {
                Err(format!(
                    "Failed to stop service with launchctl: {}",
                    service
                ))
            }
        })
}

/**
 * Restart a service
 *
 * @example
 * ```
 * brew::restart_service("nginx")?;
 * ```
 */
pub fn restart_service(service: &str) -> Result<(), String> {
    BrewCommand::new(&["services", "restart", service]).run()?;
    Ok(())
}

/**
 * Get the launch agent path
 */
pub fn get_launch_agent_path(service: &str) -> Result<PathBuf, String> {
    let home = dirs::home_dir().ok_or("Could not get home directory")?;
    let plist = format!("homebrew.mxcl.{}.plist", service);
    Ok(home.join("Library").join("LaunchAgents").join(plist))
}
