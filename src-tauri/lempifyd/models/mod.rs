pub mod service_controller;

use crate::services::error::ServiceError;
use crate::services::isolation::ServiceIsolation;

pub trait Service {
    fn name(&self) -> &str;
    fn version(&self) -> &str;
    fn isolation(&self) -> &ServiceIsolation;
    fn is_installed(&self) -> bool;
    fn is_running(&self) -> bool;
    fn start(&self) -> Result<bool, ServiceError>;
    fn stop(&self) -> Result<bool, ServiceError>;
    fn restart(&self) -> Result<bool, ServiceError>;
    fn install(&self) -> Result<bool, ServiceError>;
}