
mod service;
mod helpers;

use crate::service::php::PhpService;
use crate::helpers::service_manager::ServiceController;

fn main() {
    println!("🚀 Starting Lempify DAEMON");

    let php83 = PhpService { version: "8.3".to_string() };

    if php83.is_installed() {
        println!("✅ PHP 8.3 found.");
    } else {
        println!("❌ PHP 8.3 not found!.");
    }

    if let Err(err) = php83.start() {
        eprintln!("🚫 Failed to start PHP: {}", err);
    }

    println!("🔥 lempifyd daemon booted up!");

    loop {
        println!("👂 Daemons is running...");
        std::thread::sleep(std::time::Duration::from_secs(10));
    }
}
