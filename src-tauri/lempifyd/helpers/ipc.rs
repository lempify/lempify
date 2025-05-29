use std::thread;
use serde::Deserialize;
use std::io::{BufRead, BufReader};
use std::os::unix::net::{UnixListener, UnixStream};
use std::fs;

use shared::constants::LEMPIFYD_SOCKET_PATH;
use crate::service::get_all_services;

#[derive(Debug, Deserialize)]
pub struct DaemonCommand {
    pub service: String,
    pub action: String,
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

fn handle_client(stream: UnixStream) {
    let mut reader = BufReader::new(stream);
    let mut line = String::new();

    if let Ok(_) = reader.read_line(&mut line) {
        match serde_json::from_str::<DaemonCommand>(&line) {
            Ok(cmd) => {
                //println!("🛠 Handling command: {:?}", cmd);

                let services = get_all_services()
                    .into_iter()
                    .find(|s| s.name() == cmd.service);

                if let Some(service) = services {
                    match cmd.action.as_str() {
                        "start" => {
                            if let Err(e) = service.start() {
                                eprintln!("❌ Start failed: {}", e);
                            }
                        }
                        "stop" => {
                            if let Err(e) = service.stop() {
                                eprintln!("❌ Stop failed: {}", e);
                            }
                        }
                        "restart" => {
                            if let Err(e) = service.restart() {
                                eprintln!("❌ Restart failed: {}", e);
                            }
                        }
                        _ => eprintln!("❓ Unknown action: {}", cmd.action),
                    }
                } else {
                    eprintln!("🚫 Unknown service: {}", cmd.service);
                }
            }
            Err(e) => eprintln!("❌ Invalid JSON: {:?}", e),
        }
    }
}
