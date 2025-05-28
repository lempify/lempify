use std::process::Command;

use crate::traits::service_controller::ServiceController;

use shared::brew;

pub struct NginxServiceController;

impl ServiceController for NginxServiceController {
    fn name(&self) -> &'static str {
        "nginx"
    }

    fn is_installed(&self) -> bool {
        which::which("nginx").is_ok()
    }

    fn is_running(&self) -> bool {
        //println!("Brew prefix: {}", brew::get_path_prefix().unwrap());
        // Check if nginx is running by checking if it's listening on port 80
        if let Ok(output) = Command::new("lsof")
            // ports 80, 8080, 443 with grep on nginx
            .arg("-i :80,8080,443")
            .arg("|")
            .arg("grep")
            .arg("nginx")
            .output() {
            !output.stdout.is_empty()
        } else {
            false
        }
    }

    fn start(&self) -> Result<(), String> {
        if self.is_running() {
            return Ok(());
        }
        brew::start_service("nginx")?;
        Ok(())
    }

    fn stop(&self) -> Result<(), String> {
        if !self.is_running() {
            return Ok(());
        }
        brew::stop_service("nginx")?;

        Ok(())
    }
}
