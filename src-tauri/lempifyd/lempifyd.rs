use helpers::ipc;

use shared::brew;

mod helpers;
mod models;
mod services;

fn main() {
    println!("[lempifyd:pid]: {}", std::process::id());

    // Start IPC server
    if let Err(e) = ipc::start_server() {
        eprintln!("[lempifyd]: Failed to start IPC server: {}", e);
    }

    if !brew::is_installed() {
        brew::install().unwrap();
    }

    loop {
        //println!("[lempifyd]: heartbeat");
        std::thread::sleep(std::time::Duration::from_secs(10));
    }
}
