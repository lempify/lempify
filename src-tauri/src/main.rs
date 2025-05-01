// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod commands;
mod error;
mod helpers;
mod models;
mod ui;

use error::Result;

use tauri::{RunEvent, WindowEvent};

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

    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            // Start - lempifyd daemon
            helpers::sidecar::spawn(helpers::sidecar::start(&app))?;
            // Build - menu
            ui::menu::build(&app)?;
            Ok(())
        });

    let app = builder
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
            commands::lempifyd::lempifyd,
        ])
        //.menu(tauri::Menu::os_default(&tauri::generate_context!().package_info().name))
        .build(tauri::generate_context!())
        .expect("❌ Could not build application");

    app.run(move |_app_handle, _event| match _event {
        RunEvent::ExitRequested { .. } => {
            println!("ExitRequested fired!");
        }
        RunEvent::Exit => {
            println!("Exit fired!"); // Fires on; X click and CMD+Q
        }
        RunEvent::MenuEvent(menu_event) if menu_event.id() == "quit" => {
            println!("MenuEvent fired!");
        }
        RunEvent::WindowEvent {
            event: WindowEvent::CloseRequested { .. },
            ..
        } => {
            println!("CloseRequested fired!");
        }
        _ => (),
    });

    Ok(())
}
