use shared::brew;

/**
 * @see `./src-tauri/src/helpers/ssl.rs` for usage.
 * @TODO: Use this service in mkcert code.
 */
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
        "mkcert"
    }

    fn is_required(&self) -> bool {
        true
    }

    fn human_name(&self) -> &str {
        "mkcert"
    }

    fn url(&self) -> &str {
        #[cfg(target_os = "macos")]
        {
            "https://formulae.brew.sh/formula/mkcert"
        }
        #[cfg(target_os = "linux")]
        {
            "https://github.com/FiloSottile/mkcert"
        }
    }

    fn is_installed(&self) -> bool {
        brew::is_formulae_installed(self.name())
    }

    fn is_running(&self) -> bool {
        self.is_installed()
    }

    fn get_type(&self) -> &str {
        "tool"
    }

    fn version(&self) -> &str {
        &self.version
    }
}
