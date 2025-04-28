use std::io::{BufRead, BufReader, Write};
use std::os::unix::net::{UnixListener, UnixStream};
use std::thread;

use crate::helpers::constants::SOCKET_PATH;

/**
 * Start the IPC server
 * 
 * 1. Clean old socket if needed
 * 2. Start listening thread first
 * 3. Then send ready signal
 */
pub fn start_server() {
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

    if let Ok(mut stream) = UnixStream::connect(SOCKET_PATH) {
        let _ = stream.write_all(b"READY");
        let _ = stream.flush();
    }
}

/**
 * Handle a client connection
 */
fn handle_client(stream: UnixStream) {
    let mut reader = BufReader::new(stream.try_clone().unwrap());
    let mut line = String::new();
    if let Ok(_bytes_read) = reader.read_line(&mut line) {
        println!("{}", line.trim());
    }
}
