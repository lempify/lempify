use helpers::ipc;
use service::get_all_services;

use shared::brew;

mod helpers;
mod models;
mod service;
mod traits;

fn main() {
    //println!("[lempifyd:pid]: {}", std::process::id());

    // Start IPC server
    let _ = ipc::start_server();

    if !brew::is_installed() {
        //println!("⚠️  Brew is not installed.");
        brew::install().unwrap();
    }

    for service in get_all_services() {
        if !service.is_installed() {
            //println!("⚠️  {} is not installed", service.name());
            continue;
        }
        //println!("✅ {} is installed", service.name());

        // Ensure service is stopped before starting
        if !service.is_running() {
            //println!("⏯️  Starting {}...", service.name());
            if let Err(e) = service.start() {
                eprintln!("❌ Failed to start {}: {}", service.name(), e);
            } else {
                //println!("✅ {} started", service.name());
            }
        }
    }

    loop {
        //println!("[lempifyd]: heartbeat");
        std::thread::sleep(std::time::Duration::from_secs(10));
    }
}
