use std::os::unix::net::UnixStream;
use std::io::Write;

pub fn send_message(socket_path: &str, message: &str) -> std::io::Result<()> {
    let mut stream = UnixStream::connect(socket_path)?;
    stream.write_all(message.as_bytes())?;
    Ok(())
}
