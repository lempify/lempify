
use crate::helpers::service_manager::ServiceController;
use std::process::Command;

pub struct NginxService;

impl ServiceController for NginxService {
    fn name(&self) -> &'static str {
        "nginx"
    }

    fn is_installed(&self) -> bool {
        which::which("nginx").is_ok()
    }

    fn is_running(&self) -> bool {
        // Simple version — check if nginx PID exists
        // In production, maybe check a socket or use PID file
        false
    }

    fn start(&self) -> Result<(), String> {
        Command::new("nginx")
            .arg("-c")
            .arg("/opt/homebrew/etc/nginx/nginx.conf")
            .spawn()
            .map_err(|e| format!("Failed to start nginx: {}", e))?;
        Ok(())
    }

    fn stop(&self) -> Result<(), String> {
        Command::new("nginx")
            .arg("-s")
            .arg("stop")
            .output()
            .map_err(|e| format!("Failed to stop nginx: {}", e))?;
        Ok(())
    }
}
