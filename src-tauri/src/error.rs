use std::fmt;

#[derive(Debug)]
pub enum LempifyError {
    ServiceError(String),
    InstallationError(String),
    SystemError(String),
    IoError(std::io::Error),
}

impl fmt::Display for LempifyError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            LempifyError::ServiceError(msg) => write!(f, "Service error: {}", msg),
            LempifyError::InstallationError(msg) => write!(f, "Installation error: {}", msg),
            LempifyError::SystemError(msg) => write!(f, "System error: {}", msg),
            LempifyError::IoError(e) => write!(f, "IO error: {}", e),
        }
    }
}

impl std::error::Error for LempifyError {}

impl From<std::io::Error> for LempifyError {
    fn from(error: std::io::Error) -> Self {
        LempifyError::IoError(error)
    }
}

pub type Result<T> = std::result::Result<T, LempifyError>;
