use crate::error::{LempifyError, Result};

use shared::brew;

pub fn install_via_brew(formula: &str) -> Result<()> {
    brew::install_service(formula).map_err(|e| {
        LempifyError::InstallationError(format!("Failed to install {}: {}", formula, e))
    })
}
