use thiserror::Error;

#[derive(Error, Debug)]
pub enum ServiceError {
    #[error("File system error: {0}")]
    FileSystemError(String),

    #[error("User error: {0}")]
    UserError(String),

    #[error("Service error: {0}")]
    ServiceError(String),

    #[error("Configuration error: {0}")]
    ConfigError(String),

    #[error("Brew command failed: {0}")]
    BrewError(String),

    #[error("Service not installed: {0}")]
    NotInstalled(String),

    #[error("Service already running: {0}")]
    AlreadyRunning(String),

    #[error("Service not running: {0}")]
    NotRunning(String),
} 