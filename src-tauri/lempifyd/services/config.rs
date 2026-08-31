use shared::file_system::AppFileSystem;
use std::path::PathBuf;

use super::error::ServiceError;

pub struct ServiceConfig {
    pub file_system: AppFileSystem,
    service_name: String,
    #[allow(dead_code)]
    version: String,
    #[allow(dead_code)]
    config_path: PathBuf,
}

impl ServiceConfig {
    pub fn new(
        file_system: AppFileSystem,
        service_name: String,
        version: String,
    ) -> Result<Self, ServiceError> {
        let config_path = file_system
            .config_dir
            .join(format!("{}.conf", service_name));

        Ok(Self {
            file_system,
            service_name,
            version,
            config_path,
        })
    }

    pub fn get_config_path(&self) -> PathBuf {
        match self.service_name.as_str() {
            "nginx" => self.file_system.nginx_dir.clone(),
            "php" => self
                .file_system
                .config_dir
                .join("services")
                .join("php")
                .join("config"),
            "mysql" => self
                .file_system
                .config_dir
                .join("services")
                .join("mysql")
                .join("config"),
            _ => self
                .file_system
                .config_dir
                .join("services")
                .join(&self.service_name)
                .join("config"),
        }
    }

    pub fn ensure_paths(&self) -> Result<(), ServiceError> {
        let config_path = self.get_config_path();

        // Ensure parent directory exists. This lives under the user's own
        // Application Support directory, so it needs no elevated privileges —
        // the previous `sudo mkdir` was both unnecessary and outside the scoped
        // sudoers policy.
        if let Some(parent) = config_path.parent() {
            self.file_system
                .create_dir_all(parent)
                .map_err(|e| ServiceError::FileSystemError(e.to_string()))?;
        }

        Ok(())
    }

    pub fn create_dir(&self, path: &PathBuf) -> Result<(), ServiceError> {
        self.file_system
            .create_dir_all(path)
            .map_err(|e| ServiceError::FileSystemError(e.to_string()))
    }

    pub fn write_file(&self, path: &PathBuf, content: &str) -> Result<(), ServiceError> {
        self.file_system
            .write_file(path, content)
            .map_err(|e| ServiceError::FileSystemError(e.to_string()))
    }
}
