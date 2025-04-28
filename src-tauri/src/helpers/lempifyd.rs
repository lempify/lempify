use std::io::Write;
use std::os::unix::net::UnixStream;

pub fn send(action: &str) -> Result<(), Box<dyn std::error::Error>> {
    let mut stream = UnixStream::connect("/tmp/lempifyd.sock")?;

    let json_payload = serde_json::to_string(cmd)?;
    let payload = format!("{}\n", json_payload);

    stream.write_all(payload.as_bytes())?;
    stream.flush()?;

    Ok(())
}
