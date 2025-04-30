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

use tauri::{RunEvent, WindowEvent, menu::MenuBuilder};
use tauri_plugin_shell::ShellExt;

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
            /* Start - lempifyd daemon */
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
                                if s.contains("READY") {
                                    // lempifyd::send("start_php");
                                    println!("Daemon READY");
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
            /* End - lempifyd daemon */

            /* Test */
            let menu = MenuBuilder::new(app)
                .text("open", "Open")
                .text("close", "Close")
                .build()?;

            app.set_menu(menu)?;

            app.on_menu_event(move |app_handle: &tauri::AppHandle, event| {
                println!("menu event: {:?}", event.id());

                match event.id().0.as_str() {
                    "open" => {
                        println!("open event");
                    }
                    "close" => {
                        println!("close event");
                    }
                    _ => {
                        println!("unexpected menu event");
                    }
                }
            });

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
            commands::control_service::control_service,
        ])
        //.menu(tauri::Menu::os_default(&tauri::generate_context!().package_info().name))
        .build(tauri::generate_context!())
        .expect("❌ Could not build application");

    app.run(move |_app_handle, _event| match &_event {
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
