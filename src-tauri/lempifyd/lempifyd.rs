use helpers::ipc;

use shared::brew;

mod models;
mod services;
mod helpers;

fn main() {
    println!("[lempifyd:pid]: {}", std::process::id());

    // Start IPC server
    let _ = ipc::start_server();

    if !brew::is_installed() {
        brew::install().unwrap();
    }
    
    loop {
        //println!("[lempifyd]: heartbeat");
        std::thread::sleep(std::time::Duration::from_secs(10));
    }
}
