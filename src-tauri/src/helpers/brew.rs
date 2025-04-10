use std::path::PathBuf;
use std::process::Command;
use dirs;
use users;

pub fn is_service_running(service: &str) -> bool {
    Command::new("brew")
        .arg("services")
        .arg("list")
        .output()
        .map_or(false, |output| {
            let output_str = String::from_utf8_lossy(&output.stdout);
            output_str
                .lines()
                .any(|line| line.contains(service) && line.contains("started"))
        })
}

pub fn get_launch_agent_path(service: &str) -> Result<PathBuf, String> {
    let home = dirs::home_dir().ok_or("Could not determine home directory")?;
    let plist = format!("homebrew.mxcl.{}.plist", service);
    let path = home.join("Library").join("LaunchAgents").join(plist);
    Ok(path)
}

pub fn stop_service(service: &str) -> Result<(), String> {
    let status = Command::new("brew")
        .arg("services")
        .arg("stop")
        .arg(service)
        .status()
        .map_err(|e| format!("Failed to stop {}: {}", service, e))?;

    if status.success() {
        Ok(())
    } else {
        // Optional: fallback to launchctl if brew fails
        eprintln!("brew failed to stop {}; trying launchctl fallback", service);
        stop_service_fallback(service)
    }
}

fn stop_service_fallback(service: &str) -> Result<(), String> {
    let plist_path = get_launch_agent_path(service)?;
    let uid = users::get_current_uid();
    let target = format!("gui/{}", uid);

    let status = Command::new("launchctl")
        .arg("bootout")
        .arg(&target)
        .arg(plist_path)
        .status()
        .map_err(|e| format!("launchctl bootout failed: {}", e))?;

    if status.success() {
        Ok(())
    } else {
        Err(format!("Failed to stop service with launchctl: {}", service))
    }
}


pub fn start_service(service: &str) -> Result<(), String> {
    let status = Command::new("brew")
        .arg("services")
        .arg("start")
        .arg(service)
        .status()
        .map_err(|e| format!("Failed to start {}: {}", service, e))?;

    if status.success() {
        Ok(())
    } else {
        Err(format!("brew failed to start {}", service))
    }
}

pub fn repair_service(service: &str) -> Result<(), String> {
    println!("Repairing service: {}", service);

    // Try to stop it gracefully
    let _ = stop_service(service); // Ignore errors, we're gonna nuke it anyway

    // Try launchctl bootout manually as backup
    let _ = stop_service_fallback(service); // Also ignore errors here

    // Remove the .plist if it still exists
    let _ = get_launch_agent_path(service).map(|path| {
        if path.exists() {
            std::fs::remove_file(&path).ok();
        }
    });

    // Cleanup broken launchd state
    let _ = Command::new("brew")
        .arg("services")
        .arg("cleanup")
        .status();

    // Reinstall the service (force)
    let reinstall_status = Command::new("brew")
        .arg("reinstall")
        .arg(service)
        .status()
        .map_err(|e| format!("Failed to reinstall {}: {}", service, e))?;

    if !reinstall_status.success() {
        return Err(format!("brew reinstall failed for {}", service));
    }

    // Start the service fresh
    start_service(service)?;

    Ok(())
}
