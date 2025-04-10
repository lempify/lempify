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

pub fn is_installed(bin: &str) -> bool {
    Command::new("which")
        .arg(bin)
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false)
}

pub fn get_version(bin: &str, args: &[&str], use_stderr: bool) -> Option<String> {
    let output = Command::new(bin)
        .args(args)
        .stderr(Stdio::piped())
        .stdout(Stdio::piped())
        .output()
        .ok()?;

    let output_str = if use_stderr {
        String::from_utf8_lossy(&output.stderr)
    } else {
        String::from_utf8_lossy(&output.stdout)
    };

    Some(output_str.trim().to_string())
}

pub fn install_via_brew(formula: &str) -> Result<(), String> {
    let status = Command::new("brew")
        .arg("install")
        .arg(formula)
        .status()
        .map_err(|e| e.to_string())?;

    if status.success() {
        let _ = Command::new("brew")
            .arg("link")
            .arg(formula)
            .arg("--overwrite")
            .arg("--force")
            .status();

        Ok(())
    } else {
        Err(format!("Failed to install {}", formula))
    }
}
