use crate::service::get_all_services;

use std::thread;
use serde::Deserialize;
use std::io::{BufRead, BufReader};
use std::os::unix::net::{UnixListener, UnixStream};
use std::fs;

#[derive(Debug, Deserialize)]
pub struct DaemonCommand {
    pub service: String,
    pub action: String,
}

pub fn start_server() {
    // Clean up any existing socket file
    let socket_path = "/tmp/lempifyd.sock";
    if let Err(e) = fs::remove_file(socket_path) {
        if e.kind() != std::io::ErrorKind::NotFound {
            eprintln!("⚠️ Failed to remove existing socket: {}", e);
        }
    }

    let listener = UnixListener::bind(socket_path)
        .expect("Failed to bind IPC socket");

    println!("✅ IPC server started at {}", socket_path);

    thread::spawn(move || {
        for stream in listener.incoming() {
            if let Ok(stream) = stream {
                handle_client(stream);
            }
        }
    });
}

fn handle_client(stream: UnixStream) {
    let mut reader = BufReader::new(stream);
    let mut line = String::new();

    if let Ok(_) = reader.read_line(&mut line) {
        match serde_json::from_str::<DaemonCommand>(&line) {
            Ok(cmd) => {
                println!("🛠 Handling command: {:?}", cmd);

                let service = get_all_services()
                    .into_iter()
                    .find(|s| s.name() == cmd.service);

                if let Some(svc) = service {
                    match cmd.action.as_str() {
                        "start" => {
                            if let Err(e) = svc.start() {
                                eprintln!("❌ Start failed: {}", e);
                            }
                        }
                        "stop" => {
                            if let Err(e) = svc.stop() {
                                eprintln!("❌ Stop failed: {}", e);
                            }
                        }
                        "restart" => {
                            if let Err(e) = svc.restart() {
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
