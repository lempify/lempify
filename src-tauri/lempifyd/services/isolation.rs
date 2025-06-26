use std::path::PathBuf;
use shared::file_system::AppFileSystem;
use crate::services::error::ServiceError;
use shared::brew::BrewCommand;
use users::{get_current_uid, get_user_by_uid};

pub struct ServiceIsolation {
    file_system: AppFileSystem,
    service_name: String,
}

impl ServiceIsolation {
    pub fn new(service_name: &str) -> Result<Self, ServiceError> {
        Ok(Self {
            file_system: AppFileSystem::new()
                .map_err(|e| ServiceError::FileSystemError(e.to_string()))?,
            service_name: service_name.to_string(),
        })
    }

    /// Get runtime socket path (temporary, for active connections)
    /// Used by MySQL and other services that need runtime sockets
    pub fn get_socket_path(&self) -> PathBuf {
        let uid = get_current_uid();
        let user = get_user_by_uid(uid).expect("Failed to get current user");
        PathBuf::from(format!("/tmp/lempify/{}/sockets", user.name().to_string_lossy()))
            .join(format!("{}.sock", self.service_name))
    }

    /// Get runtime config path (temporary, for active service configs)
    /// Used by services that need runtime configuration files
    pub fn get_config_path(&self) -> PathBuf {
        let uid = get_current_uid();
        let user = get_user_by_uid(uid).expect("Failed to get current user");
        PathBuf::from(format!("/tmp/lempify/{}/config", user.name().to_string_lossy()))
            .join(format!("{}.conf", self.service_name))
    }

    /// Get runtime log path (temporary, for active service logs)
    /// Used by services that need runtime log files
    pub fn get_log_path(&self) -> PathBuf {
        let uid = get_current_uid();
        let user = get_user_by_uid(uid).expect("Failed to get current user");
        PathBuf::from(format!("/tmp/lempify/{}/logs", user.name().to_string_lossy()))
            .join(format!("{}.log", self.service_name))
    }

    /// Get persistent service config directory (for stored configurations)
    /// Used by PHP and other services for persistent config files
    pub fn get_service_config_dir(&self) -> PathBuf {
        self.file_system.config_dir
            .join("services")
            .join(&self.service_name)
    }

    /// Get persistent service socket directory (for stored socket files)
    /// Used by PHP for version-specific socket paths
    pub fn get_service_socket_dir(&self) -> PathBuf {
        self.file_system.config_dir
            .join("services")
            .join(&self.service_name)
            .join("sockets")
    }

    /// Get persistent service socket directory (for stored socket files, no spaces)
    /// Used by PHP for version-specific socket paths
    pub fn get_service_socket_dir_no_spaces(&self) -> PathBuf {
        PathBuf::from("/tmp/lempify")
            .join("services")
            .join(&self.service_name)
            .join("sockets")
    }

    /// Get persistent service log directory (for stored log files)
    /// Used by services for persistent log storage
    pub fn get_service_log_dir(&self) -> PathBuf {
        self.file_system.config_dir
            .join("services")
            .join(&self.service_name)
            .join("logs")
    }

    pub fn ensure_paths(&self) -> Result<(), ServiceError> {
        let paths = vec![
            self.get_socket_path().parent().unwrap().to_path_buf(),
            self.get_config_path().parent().unwrap().to_path_buf(),
            self.get_log_path().parent().unwrap().to_path_buf(),
            self.get_service_config_dir(),
            self.get_service_socket_dir(),
            self.get_service_log_dir(),
        ];

        for path in paths {
            self.file_system
                .create_dir_all(&path)
                .map_err(|e| ServiceError::FileSystemError(e.to_string()))?;
        }

        Ok(())
    }

    pub fn brew_command<'a>(&self, args: &[&'a str]) -> BrewCommand<'a> {
        BrewCommand::new(args)
    }
} 