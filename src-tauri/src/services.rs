use std::process::{Command, Stdio};
use serde::{Serialize, Deserialize};
use tauri::command;

use crate::helpers::brew::{is_service_running, start_service as brew_start, stop_service as brew_stop};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ServiceType {
    Php,
    Mysql,
    Nginx,
}

#[derive(Debug, Clone, Serialize)]
pub struct ServiceStatus {
    pub name: String,
    pub installed: bool,
    pub version: Option<String>,
    pub running: bool,
}

// Phase 2.

fn get_brew_formula(service: &ServiceType) -> &'static str {
    match service {
        ServiceType::Php => "php",
        ServiceType::Mysql => "mysql",
        ServiceType::Nginx => "nginx",
    }
}

fn get_version_args(service: &ServiceType) -> (&'static [&'static str], bool) {
    match service {
        ServiceType::Php => (&["-v"], false),
        ServiceType::Mysql => (&["--version"], false),
        ServiceType::Nginx => (&["-v"], true), // outputs to stderr
    }
}

fn is_installed(bin: &str) -> bool {
    Command::new("which")
        .arg(bin)
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false)
}

fn get_version(bin: &str, args: &[&str], use_stderr: bool) -> Option<String> {
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

fn install_via_brew(formula: &str) -> Result<(), String> {
    let status = Command::new("brew")
        .arg("install")
        .arg(formula)
        .status()
        .map_err(|e| e.to_string())?;

    if status.success() {
        // Attempt link too, in case it was installed but not linked
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

/* COMMANDS */

#[command]
pub fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[command]
pub fn get_service_status(service: ServiceType) -> ServiceStatus {
    let bin = get_brew_formula(&service);
    let installed = is_installed(bin);
    let version = if installed {
        let (args, use_stderr) = get_version_args(&service);
        get_version(bin, args, use_stderr)
    } else {
        None
    };

    let brew_formula = get_brew_formula(&service);
    let running = is_service_running(brew_formula);

    ServiceStatus {
        name: bin.to_string(),
        installed,
        version,
        running,
    }
}

#[command]
pub fn install_service(service: ServiceType) -> Result<String, String> {
    let formula = get_brew_formula(&service);
    install_via_brew(formula)?;
    Ok(format!("{} installed", formula))
}

#[command]
pub fn start_service(service: ServiceType) -> Result<String, String> {
    let formula = get_brew_formula(&service);
    brew_start(formula)?;
    Ok(format!("Started {}", formula))
}

#[command]
pub fn stop_service(service: ServiceType) -> Result<String, String> {
    let formula = get_brew_formula(&service);
    brew_stop(formula)?;
    Ok(format!("Stopped {}", formula))
}

#[command]
pub async fn repair_service(service: ServiceType) -> Result<String, String> {
    let formula = get_brew_formula(&service);
    crate::helpers::brew::repair_service(formula)?;
    Ok(format!("Successfully repaired {}", formula))
}
