// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod error;
mod helpers;
mod models;
mod ui;

use error::Result;

fn main() -> Result<()> {
    if let Err(e) = helpers::system::patch_path() {
        eprintln!("⚠️ Failed to patch PATH: {}", e);
    }

    if let Err(e) = helpers::nginx::ensure_lempify_include_in_nginx_conf() {
        eprintln!("⚠️ Failed to patch nginx.conf: {}", e);
    }

    if let Ok(brew_path) = helpers::system::get_brew_path() {
        println!("🍺 brew found at: {}", brew_path);
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            #[cfg(debug_assertions)]
            {
                // let window = app.get_webview_window("main").unwrap();
                // window.open_devtools();
                // window.close_devtools();

                if let Err(e) = ui::tray::setup_tray(app) {
                    eprintln!("⚠️ Failed to setup tray: {}", e);
                }
            }
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
