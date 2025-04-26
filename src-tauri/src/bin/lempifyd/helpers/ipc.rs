use std::io::{BufRead, BufReader, Write};
use std::os::unix::net::{UnixListener, UnixStream};
use std::thread;

/// Socket file path
pub const SOCKET_PATH: &str = "/tmp/lempifyd.sock";

/// Start the IPC server
pub fn start_ipc_server() {
    // Clean old socket if needed
    let _ = std::fs::remove_file(SOCKET_PATH);

    let listener = UnixListener::bind(SOCKET_PATH)
        .expect("Failed to bind IPC socket");

    println!("🛜 Listening for IPC on {}", SOCKET_PATH);

    thread::spawn(move || {
        for stream in listener.incoming() {
            if let Ok(stream) = stream {
                handle_client(stream);
            }
        }
    });
}

/// Handle a client connection
fn handle_client(stream: UnixStream) {
    let mut reader = BufReader::new(stream.try_clone().unwrap());

    let mut line = String::new();
    if let Ok(_bytes_read) = reader.read_line(&mut line) {
        println!("📩 Received from GUI: {}", line.trim());
        // TODO: You can match JSON actions here
    }
}

/// Optional: Helper for daemon to send messages back (not needed if GUI is just a client)
pub fn _send_response(mut stream: UnixStream, message: &str) {
    let _ = stream.write_all(message.as_bytes());
    let _ = stream.flush();
}
