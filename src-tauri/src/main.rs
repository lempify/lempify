// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::process::Command;
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager,
};

use tauri_plugin_shell;
// Modules
mod commands;
mod helpers;
mod models;
mod utils;

/**
 * Patch the PATH to include the brew locations
 */
fn patch_path() {
    if let Ok(path) = std::env::var("PATH") {
        let mut paths: Vec<String> = path.split(':').map(|s| s.to_string()).collect();

        let brew_locations = [
            "/opt/homebrew/bin",
            "/opt/homebrew/sbin",
            "/usr/local/bin",
            "/usr/local/sbin",
        ];

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

    if let Err(e) = crate::helpers::nginx::ensure_lempify_include_in_nginx_conf() {
        println!("⚠️ Failed to patch nginx.conf: {e}");
    }

    let output = Command::new("which").arg("brew").output();
    if let Ok(output) = output {
        println!(
            "🍺 brew found at: {}",
            String::from_utf8_lossy(&output.stdout)
        );
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            #[cfg(debug_assertions)]
            {
                let window = app.get_webview_window("main").unwrap();
                window.open_devtools();
                window.close_devtools();

                let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
                let menu = Menu::with_items(app, &[&quit_i])?;

                let _ = TrayIconBuilder::new()
                    .icon(app.default_window_icon().unwrap().clone())
                    .menu(&menu)
                    .show_menu_on_left_click(false)
                    .on_menu_event(|app, event| match event.id.as_ref() {
                        "quit" => {
                            println!("quit menu item was clicked");
                            app.exit(0);
                        }
                        _ => {
                            println!("menu item {:?} not handled", event.id);
                        }
                    })
                    .on_tray_icon_event(|tray, event| match event {
                        TrayIconEvent::Click {
                            button: MouseButton::Left,
                            button_state: MouseButtonState::Up,
                            ..
                        } => {
                            println!("left click pressed and released");
                            // in this example, let's show and focus the main window when the tray is clicked
                            let app = tray.app_handle();
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                        _ => {
                            println!("unhandled event {event:?}");
                        }
                    })
                    .build(app)?;
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
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
