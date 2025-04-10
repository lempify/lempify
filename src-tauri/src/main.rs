// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::process::Command;
use tauri::Manager;

// Modules
mod commands;
mod models;
mod utils;
mod helpers;

fn patch_path() {
    if let Ok(path) = std::env::var("PATH") {
        let mut paths: Vec<String> = path.split(':').map(|s| s.to_string()).collect();

        let brew_locations = ["/opt/homebrew/bin", "/opt/homebrew/sbin", "/usr/local/bin", "/usr/local/sbin"];

        for brew_path in brew_locations.iter() {
            if !paths.contains(&brew_path.to_string()) {
                paths.push(brew_path.to_string());
            }
        }

        let joined = paths.join(":");
        println!("🐛 Final patched PATH: {}", joined);
        std::env::set_var("PATH", joined);
    }
}

fn main() {
    patch_path();

    let output = Command::new("which").arg("brew").output();
    if let Ok(output) = output {
        println!("🍺 brew found at: {}", String::from_utf8_lossy(&output.stdout));
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            #[cfg(debug_assertions)]
            {
                let window = app.get_webview_window("main").unwrap();
                window.open_devtools();
                window.close_devtools();
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::service_status::get_service_status,
            commands::install::install_service,
            commands::start_stop::start_service,
            commands::start_stop::stop_service,
            commands::repair::repair_service,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
