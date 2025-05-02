use serde::{Deserialize, Serialize};
use std::io::Write;
use std::os::unix::net::UnixStream;

use tauri::App;
use tauri_plugin_shell::{process::Command, ShellExt};

use crate::helpers::constants::LEMPIFYD_SOCKET_PATH;

#[derive(Debug, Serialize, Deserialize)]
pub struct DaemonCommand {
    pub service: String,
    pub action: String,
}

pub fn send(cmd: &DaemonCommand) -> Result<(), String> {
    println!("[lempify:helpers:send] daemon command: {:?}", cmd);
    let mut stream = UnixStream::connect(LEMPIFYD_SOCKET_PATH)
        .map_err(|e| format!("❌ Could not connect to daemon: {}", e))?;

    let json_payload = serde_json::to_string(cmd).map_err(|e| e.to_string())?;
    let payload = format!("{}\n", json_payload); // newline-delimited JSON

    stream
        .write_all(payload.as_bytes())
        .map_err(|e| e.to_string())?;
    stream.flush().map_err(|e| e.to_string())?;

    Ok(())
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
                        println!("[lempifyd]: stdout: {}", s);
                        if s.contains("READY") {
                            // lempifyd::send("start_php");
                            println!("Daemon READY");
                        }
                    }
                }
                tauri_plugin_shell::process::CommandEvent::Stderr(line) => {
                    if let Ok(s) = String::from_utf8(line) {
                        eprintln!("[lempifyd]: stderr: {}", s);
                    }
                }
                _ => println!("[lempifyd]: other event: {:?}", event),
            }
        }
    });

    Ok(())
}
