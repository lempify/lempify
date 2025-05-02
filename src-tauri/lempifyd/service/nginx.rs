use std::process::Command;

use crate::traits::service_controller::ServiceController;

use shared::utils::brew;

pub struct NginxServiceController;

impl ServiceController for NginxServiceController {
    fn name(&self) -> &'static str {
        "nginx"
    }

    fn install(&self) -> Result<(), String> {
        // Install Nginx via Homebrew
        brew::install_service("nginx")?;

        Ok(())
    }

    fn is_installed(&self) -> bool {
        which::which("nginx").is_ok()
    }

    fn is_running(&self) -> bool {
        // Check if nginx is running by checking if it's listening on port 80
        if let Ok(output) = Command::new("lsof")
            .arg("-i:80")
            .arg("-sTCP:LISTEN")
            .output() {
            !output.stdout.is_empty()
        } else {
            false
        }
    }

    fn start(&self) -> Result<(), String> {
        // First stop any existing processes
        self.stop()?;

        // Wait a moment for ports to be released
        std::thread::sleep(std::time::Duration::from_secs(1));

        Command::new("nginx")
            .arg("-c")
            .arg("/opt/homebrew/etc/nginx/nginx.conf")
            .spawn()
            .map_err(|e| format!("Failed to start nginx: {}", e))?;
        Ok(())
    }

    fn stop(&self) -> Result<(), String> {
        // First try graceful shutdown
        if let Ok(_) = Command::new("nginx")
            .arg("-s")
            .arg("quit")
            .output() {
            // Wait for process to stop
            std::thread::sleep(std::time::Duration::from_secs(1));
        }

        // If still running, force kill
        if self.is_running() {
            if let Ok(output) = Command::new("lsof")
                .arg("-t")
                .arg("-i:80")
                .arg("-sTCP:LISTEN")
                .output() {
                if !output.stdout.is_empty() {
                    let pids: Vec<&str> = std::str::from_utf8(&output.stdout)
                        .unwrap()
                        .split('\n')
                        .filter(|pid| !pid.is_empty())
                        .collect();

                    for pid in pids {
                        if let Err(e) = Command::new("kill")
                            .arg("-9")
                            .arg(pid)
                            .output() {
                            println!("Warning: Failed to kill nginx process {}: {}", pid, e);
                        }
                    }
                }
            }
        }

        Ok(())
    }
}
