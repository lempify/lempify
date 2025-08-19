use crate::{models::Service as BaseService, services::error::ServiceError};

pub struct Service {
    version: String
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