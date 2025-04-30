use crate::helpers::php::generate_fpm_config;
use crate::helpers::service_manager::ServiceController;

pub struct PhpService {
    pub version: String,
}

impl ServiceController for PhpService {
    fn name(&self) -> &'static str {
        "php"
    }

    fn is_installed(&self) -> bool {
        which::which(format!("php@{}", self.version)).is_ok()
    }

    fn is_running(&self) -> bool {
        false
    }

    fn start(&self) -> Result<(), String> {
        let php_fpm_path = format!("/opt/homebrew/opt/php@{}/sbin/php-fpm", self.version);

        let config_path = generate_fpm_config(&self.version)?;

        let socket_path = format!("/tmp/lempify-php-{}.sock", self.version);

        // 🧹 Clean up old socket if it exists
        if std::path::Path::new(&socket_path).exists() {
            println!("🧹 Removing stale PHP socket: {}", socket_path);
            std::fs::remove_file(&socket_path)
                .map_err(|e| format!("Failed to remove old PHP socket: {}", e))?;
        }

        // 🚀 Start PHP-FPM using generated config
        std::process::Command::new(php_fpm_path)
            .arg("--nodaemonize")
            .arg("--fpm-config")
            .arg(config_path)
            .spawn()
            .map_err(|e| format!("Failed to start PHP {}: {}", self.version, e))?;

        Ok(())
    }

    fn stop(&self) -> Result<(), String> {
        Err("Stop not yet implemented.".into())
    }
}
