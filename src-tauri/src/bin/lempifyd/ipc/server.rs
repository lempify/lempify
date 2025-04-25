use std::os::unix::net::UnixListener;
use std::io::{BufReader, BufRead};
use std::fs;
use std::path::Path;

pub fn start_ipc_server(socket_path: &str) -> std::io::Result<()> {
    let path = Path::new(socket_path);
    if path.exists() {
        fs::remove_file(path)?;
    }

    let listener = UnixListener::bind(path)?;
    println!("🧩 IPC server listening at {}", socket_path);

    for stream in listener.incoming() {
        match stream {
            Ok(stream) => {
                println!("📡 Connection received!");
                let reader = BufReader::new(stream);
                for line in reader.lines() {
                    println!("📥 Received: {}", line?);
                }
            }
            Err(e) => eprintln!("❌ IPC connection failed: {}", e),
        }
    }

    Ok(())
}
