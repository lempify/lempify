use std::process::Command;

use shared::brew;

pub fn repair_service(service: &str) -> Result<(), String> {
    //println!("Repairing service: {}", service);

    // Try to stop it gracefully
    let _ = brew::stop_service(service); // Ignore errors, we're gonna nuke it anyway

    // Remove the .plist if it still exists
    let _ = brew::get_launch_agent_path(service).map(|path| {
        if path.exists() {
            std::fs::remove_file(&path).ok();
        }
    });

    // Cleanup broken launchd state
    let _ = Command::new("brew").arg("services").arg("cleanup").status();

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
    brew::start_service(service)?;

    Ok(())
}
