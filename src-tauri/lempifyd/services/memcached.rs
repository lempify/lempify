use std::{fs, process::{Command, Stdio}};

use shared::{constants::DEFAULT_PHP_VERSION, file_system::AppFileSystem};

use crate::{models::Service as BaseService, services::{error::ServiceError, php}};

pub struct Service {
    version: String,
}

impl Service {
    pub fn new(version: &str) -> Result<Self, ServiceError> {
        Ok(Self {
            version: version.to_string(),
        })
    }
}

impl BaseService for Service {
    fn name(&self) -> &str {
        "memcached"
    }

    fn human_name(&self) -> &str {
        "Memcached"
    }

    fn dependencies(&self) -> Vec<&str> {
        vec!["libmemcached", "zlib", "pkg-config"]
    }

    fn post_install(&self) -> Result<(), ServiceError> {
        // Install memcached php extension
        let output = Command::new("pecl")
            .arg("install")
            .arg("memcached")
            .env("PHP_ZLIB_DIR", "/opt/homebrew/opt/zlib")
            .stderr(Stdio::piped())
            .stdout(Stdio::piped())
            .output()
            .unwrap();

        if !output.status.success() {
            println!("{:?}", output);
            return Err(ServiceError::ServiceError(format!(
                "Failed to install memcached php extension: {}",
                String::from_utf8_lossy(&output.stderr)
            )));
        }

        // Write ext-memcached.ini to PHP conf.d so the extension is loaded.
        let app_fs = AppFileSystem::new()
            .map_err(|e| ServiceError::FileSystemError(e.to_string()))?;
        let conf_d_path = app_fs
            .etc_dir
            .join("php")
            .join(DEFAULT_PHP_VERSION)
            .join("conf.d")
            .join("ext-memcached.ini");
        if let Some(parent) = conf_d_path.parent() {
            fs::create_dir_all(parent)
                .map_err(|e| ServiceError::FileSystemError(e.to_string()))?;
        }
        fs::write(&conf_d_path, "extension=\"memcached.so\"\n")
            .map_err(|e| ServiceError::FileSystemError(e.to_string()))?;

        // Restart PHP so the new extension is picked up.
        let _ = php::Service::new(DEFAULT_PHP_VERSION).unwrap().restart();

        Ok(())
    }

    fn url(&self) -> &str {
        #[cfg(target_os = "macos")]
        {
            "https://formulae.brew.sh/formula/memcached"
        }
        #[cfg(target_os = "linux")]
        {
            "https://memcached.org/"
        }
    }

    fn get_type(&self) -> &str {
        "service"
    }

    fn version(&self) -> &str {
        &self.version
    }
}
