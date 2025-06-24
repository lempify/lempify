use helpers::ipc;
// use services::get_all_services;

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

    // for service in get_all_services() {
    //     if !service.is_installed() {
    //         continue;
    //     }

    //     // Ensure service is stopped before starting
    //     if !service.is_running() {
    //         if let Err(e) = service.start() {
    //             eprintln!("❌ Failed to start {}: {}", service.name(), e);
    //         }
    //     }
    // }

    loop {
        //println!("[lempifyd]: heartbeat");
        std::thread::sleep(std::time::Duration::from_secs(10));
    }
}
