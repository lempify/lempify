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
        "mailpit"
    }

    fn human_name(&self) -> &str {
        "Mailpit"
    }

    fn get_type(&self) -> &str {
        "tool"
    }

    fn version(&self) -> &str {
        &self.version
    }
}