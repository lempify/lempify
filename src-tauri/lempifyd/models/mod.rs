use shared::brew;

use crate::services::error::ServiceError;
use crate::services::isolation::ServiceIsolation;

pub trait Service {
    fn name(&self) -> &str;
    fn human_name(&self) -> &str {
        self.name()
    }
    fn url(&self) -> &str;
    fn command(&self) -> &str {
        self.name()
    }
    fn dependencies(&self) -> Vec<&str> {
        vec![]
    }
    fn version(&self) -> &str {
        ""
    }
    fn post_install(&self) -> Result<(), ServiceError> {
        Ok(())
    }
    #[allow(unused)]
    fn isolation(&self) -> Option<&ServiceIsolation> {
        None
    }
    fn is_required(&self) -> bool {
        false
    }
    fn get_type(&self) -> &str;
    fn is_installed(&self) -> bool {
        if self.get_type() == "service" {
            brew::is_service_installed(self.command())
        } else {
            brew::is_formulae_installed(self.name())
        }
    }
    fn uninstall(&self) -> Result<bool, ServiceError> {
        if !self.is_installed() {
            return Ok(true);
        }

        Ok(true)
    }
    fn is_running(&self) -> bool {
        brew::is_service_running(self.command())
    }
    fn start(&self) -> Result<bool, ServiceError> {
        if !self.is_installed() {
            return Err(ServiceError::NotInstalled(format!("{}", self.name())));
        }

        if self.is_running() {
            return Err(ServiceError::AlreadyRunning(format!("{}", self.name())));
        }

        let _ = brew::start_service(self.command());

        Ok(true)
    }

    fn stop(&self) -> Result<bool, ServiceError> {
        if !self.is_installed() {
            return Err(ServiceError::NotInstalled(format!("{}", self.name())));
        }

        if !self.is_running() {
            //return Err(ServiceError::NotRunning(format!("{}", self.name())));
            println!("{} is NOT running.", self.name());
            return Ok(true);
        }

        let _ = brew::stop_service(self.command());

        Ok(true)
    }

    fn restart(&self) -> Result<bool, ServiceError> {
        self.stop()?;
        self.start()
    }

    fn install(&self) -> Result<bool, ServiceError> {
        if self.is_installed() {
            return Err(ServiceError::AlreadyInstalled(format!("{}", self.name())));
        }

        for dependency in self.dependencies() {
            if brew::is_service_installed(dependency) {
                continue;
            }

            let is_installed = brew::install_service(dependency);
            if !is_installed.is_ok() {
                return Err(ServiceError::ServiceError(format!("Failed to install dependency: {}", dependency)));
            }
            println!("Installed dependency: {}", dependency);
        }

        let installer = brew::install_service(self.command());
        println!("Installed service: {:?}", installer);
        self.post_install()?;
        Ok(true)
    }
}
