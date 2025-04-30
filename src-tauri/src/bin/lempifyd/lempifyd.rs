mod helpers;
mod service;

use helpers::ipc;
use service::get_all_services;

fn main() {
    println!("[lempifyd]: starting");
    println!("[lempifyd]: process id: {}", std::process::id());

    // Start IPC server
    ipc::start_server();

    for service in get_all_services() {
        println!("🔍 Checking service: {}", service.name());

        if !service.is_installed() {
            println!("⚠️  {} is not installed", service.name());
            continue;
        }

        if !service.is_running() {
            println!("⏯️  Starting {}", service.name());
            if let Err(e) = service.start() {
                eprintln!("❌ Failed to start {}: {}", service.name(), e);
            }
        } else {
            println!("✅ {} is already running", service.name());
        }
    }

    loop {
        println!("[lempifyd]: heartbeat");
        std::thread::sleep(std::time::Duration::from_secs(10));
    }
}
