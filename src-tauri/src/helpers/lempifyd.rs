use serde::{Deserialize, Serialize};
use std::io::{Write, BufRead, BufReader};
use std::os::unix::net::UnixStream;

use tauri::App;
use tauri_plugin_shell::{process::Command, ShellExt};

use shared::constants::LEMPIFYD_SOCKET_PATH;

// @TODO: Consolidate both of these with the ipc.rs file
#[derive(Debug, Serialize, Deserialize)]
pub struct DaemonCommand {
    pub name: String,
    pub action: String,
}
#[derive(Debug, Serialize, Deserialize)]
pub struct DaemonResponse {
    pub name: String,
    pub action: String,
    pub result: serde_json::Value,
}

pub fn send(cmd: &DaemonCommand) -> Result<Option<DaemonResponse>, String> {
    let mut stream = UnixStream::connect(LEMPIFYD_SOCKET_PATH)
        .map_err(|e| format!("❌ Could not connect to daemon: {}", e))?;

    let json_payload = serde_json::to_string(cmd).map_err(|e| e.to_string())?;
    let payload = format!("{}\n", json_payload);
    println!("[lempifyd] Sending command: {}", payload);

    stream
        .write_all(payload.as_bytes())
        .map_err(|e| e.to_string())?;
    stream.flush().map_err(|e| e.to_string())?;

    // Read response from daemon
    let mut reader = BufReader::new(&stream);
    let mut response_line = String::new();
    
    if let Ok(_) = reader.read_line(&mut response_line) {
        if let Ok(response) = serde_json::from_str::<DaemonResponse>(&response_line.trim()) {
            return Ok(Some(response));
        }
    }

    Ok(None)
}

pub fn sidecar(app: &App) -> Command {
    app.shell()
        .sidecar("lempifyd")
        .expect("❌ Could not prepare lempifyd sidecar")
}

pub fn spawn(sidecar: Command) -> Result<(), Box<dyn std::error::Error>> {
    let (mut rx, _child) = sidecar.spawn().expect("❌ Could not start lempifyd daemon");

    tauri::async_runtime::spawn(async move {
        while let Some(event) = rx.recv().await {
            match event {
                tauri_plugin_shell::process::CommandEvent::Stdout(line) => {
                    if let Ok(s) = String::from_utf8(line) {
                        if s.contains("READY") {
                            println!("[lempifyd] Daemon READY");
                        }
                    }
                }
                tauri_plugin_shell::process::CommandEvent::Stderr(line) => {
                    if let Ok(s) = String::from_utf8(line) {
                        eprintln!("[lempifyd]: stderr: {}", s);
                    }
                }
                _ => {
                    //println!("[lempifyd]: other event: {:?}", event);
                }
            }
        }
    });

    Ok(())
}
