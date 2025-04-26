mod helpers;
mod service;

use helpers::ipc;

fn main() {
    println!("🚀 Starting Lempify Daemon");

    // Start IPC server
    ipc::start_ipc_server();

    // Dummy infinite loop to keep daemon alive
    loop {
        std::thread::sleep(std::time::Duration::from_secs(10));
    }
}
