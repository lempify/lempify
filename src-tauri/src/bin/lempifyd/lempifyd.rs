mod helpers;
mod service;

use helpers::ipc;

fn main() {
    println!("[lempifyd]: starting");
    println!("[lempifyd]: process id: {}", std::process::id());

    // Start IPC server
    ipc::start_server();

    loop {
        println!("[lempifyd]: heartbeat");
        std::thread::sleep(std::time::Duration::from_secs(10));
    }
}
