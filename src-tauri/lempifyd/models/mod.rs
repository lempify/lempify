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
    fn version(&self) -> &str {
        ""
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
            return Err(ServiceError::NotRunning(format!("{}", self.name())));
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

        let _ = brew::install_service(self.command());

        Ok(true)
    }

}