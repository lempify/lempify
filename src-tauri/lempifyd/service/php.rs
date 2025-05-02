use std::path::Path;
use std::process::Command;

use crate::helpers::php::generate_fpm_config;
use crate::traits::service_controller::ServiceController;

use shared::utils::brew;

pub struct PhpServiceController {
    pub version: String,
}

impl ServiceController for PhpServiceController {
    fn name(&self) -> &'static str {
        "php"
    }

    fn install(&self) -> Result<(), String> {
        // Install PHP via Homebrew
        brew::install_service(&format!("php@{}", self.version))?;

        Ok(())
    }

    fn is_installed(&self) -> bool {
        // Check for PHP binary in standard Homebrew locations
        let possible_paths = [
            format!("/opt/homebrew/opt/php@{}/bin/php", self.version),
            format!("/usr/local/opt/php@{}/bin/php", self.version),
        ];

        possible_paths.iter().any(|path| Path::new(path).exists())
    }

    fn is_running(&self) -> bool {
        let socket_path = format!("/tmp/lempify-php-{}.sock", self.version);
        std::path::Path::new(&socket_path).exists()
    }

    fn start(&self) -> Result<(), String> {
        // First stop any existing processes
        self.stop()?;

        let php_fpm_path = format!("/opt/homebrew/opt/php@{}/sbin/php-fpm", self.version);
        let config_path = generate_fpm_config(&self.version)?;

        // Start PHP-FPM using generated config
        std::process::Command::new(php_fpm_path)
            .arg("--nodaemonize")
            .arg("--fpm-config")
            .arg(config_path)
            .spawn()
            .map_err(|e| format!("Failed to start PHP {}: {}", self.version, e))?;

        Ok(())
    }

    fn stop(&self) -> Result<(), String> {
        let socket_path = format!("/tmp/lempify-php-{}.sock", self.version);
        
        // Find and kill PHP-FPM processes using this socket
        if let Ok(output) = Command::new("lsof")
            .arg("-t")
            .arg(&socket_path)
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
                        println!("Warning: Failed to kill process {}: {}", pid, e);
                    }
                }
            }
        }

        // Remove the socket file if it exists
        if std::path::Path::new(&socket_path).exists() {
            std::fs::remove_file(&socket_path)
                .map_err(|e| format!("Failed to remove socket file: {}", e))?;
        }

        Ok(())
    }
}
