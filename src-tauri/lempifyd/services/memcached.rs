use std::process::{Command, Stdio};

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

        // restart php service
        let _ = php::Service::new("8.4").unwrap().restart();

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
