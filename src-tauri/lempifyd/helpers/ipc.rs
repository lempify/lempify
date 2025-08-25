use serde::{Deserialize, Serialize};
use std::fs;
use std::io::{BufRead, BufReader, Write};
use std::os::unix::net::{UnixListener, UnixStream};
use std::thread;

use crate::services::get_all_services;
use shared::constants::LEMPIFYD_SOCKET_PATH;

// @TODO: Consolidate both of these with the helpers/lempifyd.rs file
#[derive(Debug, Deserialize)]
pub struct DaemonCommand {
    pub name: String,
    pub action: String,
}

#[derive(Debug, Serialize)]
pub struct DaemonResponse {
    pub name: String,
    pub action: String,
    pub result: serde_json::Value,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ServiceStatus {
    pub name: String,
    pub is_running: bool,
    pub is_installed: bool,
    pub version: String,
    pub formulae_type: String,
    pub is_required: bool,
    pub human_name: String,
    pub url: String,
}

#[derive(Debug)]
enum ServiceAction {
    Start,
    Stop,
    Restart,
    IsRunning,
    IsInstalled,
    Install,
}

impl ServiceAction {
    fn from_str(s: &str) -> Option<Self> {
        match s {
            "start" => Some(ServiceAction::Start),
            "stop" => Some(ServiceAction::Stop),
            "restart" => Some(ServiceAction::Restart),
            "is_running" => Some(ServiceAction::IsRunning),
            "is_installed" => Some(ServiceAction::IsInstalled),
            "install" => Some(ServiceAction::Install),
            _ => None,
        }
    }

    fn execute(
        &self,
        service: &dyn crate::models::Service,
    ) -> Result<ServiceStatus, Box<dyn std::error::Error>> {
        // Execute the action first
        match self {
            ServiceAction::Start => {
                service.start()?;
            }
            ServiceAction::Stop => {
                service.stop()?;
            }
            ServiceAction::Restart => {
                service.restart()?;
            }
            ServiceAction::Install => {
                service.install()?;
            }
            ServiceAction::IsRunning | ServiceAction::IsInstalled => {
                // No action needed for status checks
            }
        }

        // Get fresh status after action execution
        let status = ServiceStatus {
            name: service.name().to_string(),
            is_running: service.is_running(),
            is_installed: service.is_installed(),
            version: service.version().to_string(),
            formulae_type: service.get_type().to_string(),
            is_required: service.is_required(),
            human_name: service.human_name().to_string(),
            url: service.url().to_string(),
        };

        Ok(status)
    }
}

pub fn start_server() -> Result<(), String> {
    // Clean up any existing socket file
    if let Err(e) = fs::remove_file(LEMPIFYD_SOCKET_PATH) {
        if e.kind() != std::io::ErrorKind::NotFound {
            return Err(format!("Failed to remove existing socket: {}", e));
        }
    }

    let listener = UnixListener::bind(LEMPIFYD_SOCKET_PATH)
        .map_err(|e| format!("Failed to bind IPC socket: {}", e))?;

    thread::spawn(move || {
        for stream in listener.incoming() {
            if let Ok(stream) = stream {
                handle_client(stream);
            }
        }
    });

    Ok(())
}

fn handle_client(mut stream: UnixStream) {
    let mut reader = BufReader::new(&stream);
    let mut line = String::new();

    if let Ok(_) = reader.read_line(&mut line) {
        match serde_json::from_str::<DaemonCommand>(&line) {
            Ok(cmd) => {
                let cmd_name = cmd.name.as_str();
                let cmd_action = cmd.action.as_str();
                let services = get_all_services()
                    .into_iter()
                    .find(|s| s.name() == cmd_name);

                if let Some(service) = services {
                    let action = ServiceAction::from_str(&cmd_action);

                    if let Some(action) = action {
                        let result = action.execute(service.as_ref());

                        let response = match result {
                            Ok(status) => DaemonResponse {
                                name: cmd_name.to_string(),
                                action: cmd_action.to_string(),
                                result: serde_json::to_value(&status)
                                    .unwrap_or_else(|_| serde_json::json!(null)),
                            },
                            Err(e) => DaemonResponse {
                                name: cmd_name.to_string(),
                                action: cmd_action.to_string(),
                                result: serde_json::json!({"error": e.to_string()}),
                            },
                        };

                        // Write the response back to the stream
                        if let Ok(response_json) = serde_json::to_string(&response) {
                            let _ = stream.write_all(format!("{}\n", response_json).as_bytes());
                            let _ = stream.flush();
                        }
                    } else {
                        eprintln!("🚫 Unknown action: {}", cmd_action);
                    }
                } else {
                    eprintln!("🚫 Unknown service: {}", cmd.name);
                }
            }
            Err(e) => eprintln!("❌ Invalid JSON: {:?}", e),
        }
    }
}
