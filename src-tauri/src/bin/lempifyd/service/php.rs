use crate::helpers::service_manager::ServiceController;

pub struct PhpService {
    pub version: String,
}

impl ServiceController for PhpService {
    fn name(&self) -> &'static str {
        "php"
    }

    fn is_installed(&self) -> bool {
        // TODO: Replace with real detection logic
        which::which(format!("php@{}", self.version)).is_ok()
    }

    fn is_running(&self) -> bool {
        // Optional: inspect process table, socket file, or use custom PID management
        false
    }

    fn start(&self) -> Result<(), String> {
        let php_bin = format!("/opt/homebrew/opt/php@{}/sbin/php-fpm", self.version);
        std::process::Command::new(php_bin)
            .arg("--nodaemonize")
            .spawn()
            .map_err(|e| format!("Failed to start PHP {}: {}", self.version, e))?;
        Ok(())
    }

    fn stop(&self) -> Result<(), String> {
        // Optional: kill php-fpm manually or via stored PID
        Err("Not implemented".into())
    }
}
