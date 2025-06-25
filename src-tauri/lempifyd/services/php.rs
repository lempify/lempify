use shared::brew;
use shared::file_system::AppFileSystem;

use crate::models::Service;
use crate::services::error::ServiceError;
use crate::services::isolation::ServiceIsolation;
use crate::services::config::ServiceConfig;

use std::path::PathBuf;

pub struct PhpService {
    version: String,
    isolation: ServiceIsolation,
    config: ServiceConfig,
}

impl PhpService {
    pub fn new(version: &str) -> Result<Self, ServiceError> {
        let file_system = AppFileSystem::new()
            .map_err(|e| ServiceError::FileSystemError(e.to_string()))?;
        let isolation = ServiceIsolation::new("php")?;
        let config = ServiceConfig::new(
            file_system,
            "php".to_string(),
            version.to_string(),
        )?;

        Ok(Self {
            version: version.to_string(),
            isolation,
            config,
        })
    }

    fn generate_fpm_config(&self) -> String {
        let socket_path = self.isolation.get_socket_path();
        let log_path = self.isolation.get_log_path();
        
        format!(
            r#"[global]
pid = /opt/homebrew/var/run/php-fpm.pid
error_log = {}
daemonize = no

[www]
user = {}
group = staff
listen = {}
listen.mode = 0666
pm = dynamic
pm.max_children = 5
pm.start_servers = 2
pm.min_spare_servers = 1
pm.max_spare_servers = 3
"#,
            log_path.display(),
            whoami::username(),
            socket_path.display(),
        )
    }

    fn setup_config(&self) -> Result<(), ServiceError> {
        // Ensure all required paths exist
        self.isolation.ensure_paths()?;

        // Generate and write FPM config
        // let config_content = self.generate_fpm_config();
        // self.config.write_config(&config_content)?;

        Ok(())
    }
}

impl Service for PhpService {
    fn name(&self) -> &str {
        "php"
    }

    fn version(&self) -> &str {
        &self.version
    }

    fn isolation(&self) -> &ServiceIsolation {
        &self.isolation
    }

    fn is_installed(&self) -> bool {
        brew::is_service_installed("php")
    }

    fn is_running(&self) -> bool {
        brew::is_service_running("php")
    }

    fn install(&self) -> Result<bool, ServiceError> {
        if self.is_installed() {
            return Ok(true);
        }

        self.isolation
            .brew_command(&["install", &format!("php@{}", self.version)])
            .run()
            .map_err(|e| ServiceError::BrewError(e.to_string()))?;

        // Set up initial configuration after install
        self.setup_config()?;

        Ok(true)
    }

    fn start(&self) -> Result<bool, ServiceError> {
        if !self.is_installed() {
            return Err(ServiceError::NotInstalled(format!("PHP {}", self.version)));
        }

        if self.is_running() {
            return Err(ServiceError::AlreadyRunning(format!("PHP {}", self.version)));
        }

        // Ensure configuration is up to date before starting
        self.setup_config()?;

        self.isolation
            .brew_command(&["services", "start", "php"])
            .run()
            .map_err(|e| ServiceError::BrewError(e.to_string()))?;

        Ok(true)
    }

    fn stop(&self) -> Result<bool, ServiceError> {
        if !self.is_running() {
            return Err(ServiceError::NotRunning(format!("PHP {}", self.version)));
        }

        self.isolation
            .brew_command(&["services", "stop", "php"])
            .run()
            .map_err(|e| ServiceError::BrewError(e.to_string()))?;

        Ok(true)
    }

    fn restart(&self) -> Result<bool, ServiceError> {
        if !self.is_installed() {
            return Err(ServiceError::NotInstalled(format!("PHP {}", self.version)));
        }

        // Ensure configuration is up to date before restarting
        self.setup_config()?;

        self.isolation
            .brew_command(&["services", "restart", "php"])
            .run()
            .map_err(|e| ServiceError::BrewError(e.to_string()))?;

        Ok(true)
    }
}
