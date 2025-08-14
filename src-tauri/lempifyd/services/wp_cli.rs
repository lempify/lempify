use shared::brew;

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
        "wp-cli"
    }

    fn human_name(&self) -> &str {
        "WP-CLI"
    }

    fn is_installed(&self) -> bool {
        brew::is_formulae_installed(self.name())
    }

    fn is_running(&self) -> bool {
        self.is_installed()
    }

    fn command(&self) -> &str {
        "wp"
    }

    fn get_type(&self) -> &str {
        "tool"
    }

    fn version(&self) -> &str {
        &self.version
    }
}