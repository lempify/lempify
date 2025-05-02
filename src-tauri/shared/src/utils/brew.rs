use std::process::Command;
use std::path::PathBuf;

use crate::utils::paths;

/**
 * Check if Brew is installed
 */
pub fn is_installed() -> bool {
    Command::new("brew").output().is_ok()
}

/**
 * Install Brew if not installed
 */
pub fn install() -> Result<(), String> {
    Err("Install brew not implemented yet!".to_string())
}

/**
 * Run a brew command
 */
fn run_command(args: &[&str]) -> Result<(), String> {
    let status = Command::new("brew")
        .args(args)
        .status()
        .map_err(|e| format!("Failed to execute brew command: {}", e))?;

    if status.success() {
        Ok(())
    } else {
        Err(format!("brew command failed: {}", args.join(" ")))
    }
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
    let formula = service;
    
    // Install the formula
    run_command(&["install", formula])?;
    
    // Link the formula
    run_command(&["link", formula, "--overwrite", "--force"])
}

/**
 * Check if a service is installed
 */
pub fn is_service_installed(bin: &str) -> bool {
    Command::new("which")
        .arg(bin)
        .output()
        .map_or(false, |output| {
            let output_str = String::from_utf8_lossy(&output.stdout);
            output_str
                .lines()
                .any(|line| line.contains(bin) && line.contains("started"))
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
    run_command(&["services", "start", service])
}

/**
 * Stop a service
 */
pub fn stop_service(service: &str) -> Result<(), String> {
    match run_command(&["services", "stop", service]) {
        Ok(_) => Ok(()),
        Err(_) => {
            eprintln!("brew failed to stop {}; trying launchctl fallback", service);
            stop_service_fallback(service)
        }
    }
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
                Err(format!("Failed to stop service with launchctl: {}", service))
            }
        })
}

pub fn restart_service(service: &str) -> Result<(), String> {
    run_command(&["services", "restart", service])
}

/**
 * Get the launch agent path
 */
pub fn get_launch_agent_path(service: &str) -> Result<PathBuf, String> {
    let home = paths::get_output()?;
    let plist = format!("homebrew.mxcl.{}.plist", service);
    Ok(home.join("Library").join("LaunchAgents").join(plist))
}
