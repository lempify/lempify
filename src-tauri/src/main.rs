// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod error;
mod helpers;
mod models;
mod ui;

use error::Result;

use tauri_plugin_shell::ShellExt;

use helpers::ipc::send_to_lempifyd;

fn main() -> Result<()> {
    if let Err(e) = helpers::system::patch_path() {
        eprintln!("⚠️ Failed to patch PATH: {}", e);
    }

    if let Err(e) = helpers::nginx::add_lempify_to_conf() {
        eprintln!("⚠️ Failed to patch nginx.conf: {}", e);
    }

    if let Ok(brew_path) = helpers::system::get_brew_path() {
        println!("🍺 brew found at: {}", brew_path);
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            // Start the sidecar daemon
            let sidecar = app
                .shell()
                .sidecar("lempifyd")
                .expect("❌ Could not prepare lempifyd sidecar");

            let (mut rx, _child) = sidecar.spawn().expect("❌ Could not start lempifyd daemon");

            tauri::async_runtime::spawn(async move {
                while let Some(event) = rx.recv().await {
                    match event {
                        tauri_plugin_shell::process::CommandEvent::Stdout(line) => {
                            if let Ok(s) = String::from_utf8(line) {
                                println!("[lempifyd]: stdout: {}", s);
                                if s.trim() == "READY" {
                                    send_to_lempifyd("start_php");
                                }
                            }
                        }
                        tauri_plugin_shell::process::CommandEvent::Stderr(line) => {
                            if let Ok(s) = String::from_utf8(line) {
                                eprintln!("[lempifyd]: stderr: {}", s);
                            }
                        }
                        _ => println!("[lempifyd]: other event: {:?}", event),
                    }
                }
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::service_status::get_service_status,
            commands::install::install_service,
            commands::start_stop::start_service,
            commands::start_stop::stop_service,
            commands::start_stop::restart_service,
            commands::repair::repair_service,
            commands::sites::list_sites,
            commands::site::create_site,
            commands::site::delete_site,
            commands::nginx::generate_nginx_config,
            commands::ssl::add_ssl,
        ])
        .run(tauri::generate_context!())
        .map_err(|e| error::LempifyError::SystemError(e.to_string()))?;

    Ok(())
}
