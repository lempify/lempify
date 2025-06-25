use shared::brew;
use shared::file_system::AppFileSystem;
use std::fs;

use crate::models::Service;
use crate::services::error::ServiceError;
use crate::services::isolation::ServiceIsolation;
use crate::services::config::ServiceConfig;

pub struct NginxService {
    version: String,
    isolation: ServiceIsolation,
    config: ServiceConfig,
}

impl NginxService {
    pub fn new(version: &str) -> Result<Self, ServiceError> {
        let file_system = AppFileSystem::new()
            .map_err(|e| ServiceError::FileSystemError(e.to_string()))?;
        let isolation = ServiceIsolation::new("nginx")?;
        let config = ServiceConfig::new(
            file_system,
            "nginx".to_string(),
            version.to_string(),
        )?;

        Ok(Self {
            version: version.to_string(),
            isolation,
            config,
        })
    }

    /// Generate NGINX config from stub, filling in variables
    fn generate_site_config(&self, domain: &str) -> Result<String, ServiceError> {
        let stub = fs::read_to_string(NGINX_STUB_PATH)
            .map_err(|e| ServiceError::ConfigError(format!("Failed to read NGINX stub: {}", e)))?;
        let config = stub
            .replace("{{DOMAIN}}", domain)
            // If you want to replace the PHP socket path, add another .replace() here
            ;
        Ok(config)
    }

    /// Setup default NGINX configuration
    fn setup_default(&self) -> Result<(), ServiceError> {
        self.isolation.ensure_paths()?;
        self.config.ensure_paths()?;
        Ok(())
    }
}

impl Service for NginxService {
    fn name(&self) -> &str {
        "nginx"
    }

    fn version(&self) -> &str {
        &self.version
    }

    fn isolation(&self) -> &ServiceIsolation {
        &self.isolation
    }

    fn is_installed(&self) -> bool {
        brew::is_service_installed("nginx")
    }

    fn is_running(&self) -> bool {
        brew::is_service_running("nginx")
    }

    fn install(&self) -> Result<bool, ServiceError> {
        if self.is_installed() {
            return Ok(true);
        }
        self.isolation
            .brew_command(&["install", "nginx"])
            .run()
            .map_err(|e| ServiceError::BrewError(e.to_string()))?;
        self.setup_default()?;
        Ok(true)
    }

    fn start(&self) -> Result<bool, ServiceError> {
        if !self.is_installed() {
            return Err(ServiceError::NotInstalled("NGINX".to_string()));
        }
        if self.is_running() {
            return Err(ServiceError::AlreadyRunning("NGINX".to_string()));
        }
        self.setup_default()?;
        self.isolation
            .brew_command(&["services", "start", "nginx"])
            .run()
            .map_err(|e| ServiceError::BrewError(e.to_string()))?;
        Ok(true)
    }

    fn stop(&self) -> Result<bool, ServiceError> {
        if !self.is_running() {
            return Err(ServiceError::NotRunning("NGINX".to_string()));
        }
        self.isolation
            .brew_command(&["services", "stop", "nginx"])
            .run()
            .map_err(|e| ServiceError::BrewError(e.to_string()))?;
        Ok(true)
    }

    fn restart(&self) -> Result<bool, ServiceError> {
        if !self.is_installed() {
            return Err(ServiceError::NotInstalled("NGINX".to_string()));
        }
        self.setup_default()?;
        self.isolation
            .brew_command(&["services", "restart", "nginx"])
            .run()
            .map_err(|e| ServiceError::BrewError(e.to_string()))?;
        Ok(true)
    }
}
