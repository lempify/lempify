use crate::{models::Service as BaseService, services::error::ServiceError};

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
        "redis"
    }

    fn human_name(&self) -> &str {
        "Redis"
    }

    fn url(&self) -> &str {
        #[cfg(target_os = "macos")]
        {
            "https://formulae.brew.sh/formula/redis"
        }
        #[cfg(target_os = "linux")]
        {
            "https://redis.io/software/"
        }
    }

    fn get_type(&self) -> &str {
        "service"
    }

    fn version(&self) -> &str {
        &self.version
    }
}
