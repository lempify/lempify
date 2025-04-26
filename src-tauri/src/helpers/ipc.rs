use std::os::unix::net::UnixStream;
use std::io::Write;

pub fn send_to_lempifyd(action: &str) {
    if let Ok(mut stream) = UnixStream::connect("/tmp/lempifyd.sock") {
        let payload = format!("{}\n", action); // Must send \n for BufRead
        let _ = stream.write_all(payload.as_bytes());
        let _ = stream.flush();
    } else {
        eprintln!("❌ Could not connect to lempifyd daemon.");
    }
}