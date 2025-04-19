use crate::error::{LempifyError, Result};
use crate::models::service::ServiceType;
use std::process::{Command, Stdio};

pub fn get_brew_formula(service: &ServiceType) -> &'static str {
    match service {
        ServiceType::Php => "php",
        ServiceType::Mysql => "mysql",
        ServiceType::Nginx => "nginx",
    }
}

pub fn get_version_args(service: &ServiceType) -> (&'static [&'static str], bool) {
    match service {
        ServiceType::Php => (&["-v"], false),
        ServiceType::Mysql => (&["--version"], false),
        ServiceType::Nginx => (&["-v"], true),
    }
}

pub fn is_installed(bin: &str) -> Result<bool> {
    let status = Command::new("which")
        .arg(bin)
        .output()
        .map_err(|e| {
            LempifyError::SystemError(format!("Failed to check if {} is installed: {}", bin, e))
        })?
        .status
        .success();

    Ok(status)
}

pub fn get_version(bin: &str, args: &[&str], use_stderr: bool) -> Result<String> {
    let output = Command::new(bin)
        .args(args)
        .stderr(Stdio::piped())
        .stdout(Stdio::piped())
        .output()
        .map_err(|e| {
            LempifyError::ServiceError(format!("Failed to get version for {}: {}", bin, e))
        })?;

    if !output.status.success() {
        return Err(LempifyError::ServiceError(format!(
            "Failed to get version for {}",
            bin
        )));
    }

    let output_str = if use_stderr {
        String::from_utf8_lossy(&output.stderr)
    } else {
        String::from_utf8_lossy(&output.stdout)
    };

    Ok(output_str.trim().to_string())
}

pub fn install_via_brew(formula: &str) -> Result<()> {
    let status = Command::new("brew")
        .arg("install")
        .arg(formula)
        .status()
        .map_err(|e| {
            LempifyError::InstallationError(format!("Failed to install {}: {}", formula, e))
        })?;

    if !status.success() {
        return Err(LempifyError::InstallationError(format!(
            "Failed to install {}",
            formula
        )));
    }

    Command::new("brew")
        .arg("link")
        .arg(formula)
        .arg("--overwrite")
        .arg("--force")
        .status()
        .map_err(|e| {
            LempifyError::InstallationError(format!("Failed to link {}: {}", formula, e))
        })?;

    Ok(())
}
