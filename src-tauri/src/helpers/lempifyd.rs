use serde::{Serialize, Deserialize};
use std::os::unix::net::UnixStream;
use std::io::Write;

#[derive(Debug, Serialize, Deserialize)]
pub struct DaemonCommand {
    pub service: String,
    pub action: String,
}

pub fn send(cmd: &DaemonCommand) -> Result<(), String> {
    let mut stream = UnixStream::connect("/tmp/lempifyd.sock")
        .map_err(|e| format!("❌ Could not connect to daemon: {}", e))?;

    let json_payload = serde_json::to_string(cmd).map_err(|e| e.to_string())?;
    let payload = format!("{}\n", json_payload); // newline-delimited JSON

    stream.write_all(payload.as_bytes()).map_err(|e| e.to_string())?;
    stream.flush().map_err(|e| e.to_string())?;

    Ok(())
}