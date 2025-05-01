use tauri::App;
use tauri_plugin_shell::{process::Command, ShellExt};

pub fn start(app: &App) -> Command {
    app.shell()
        .sidecar("lempifyd")
        .expect("❌ Could not prepare lempifyd sidecar")
}

pub fn spawn(sidecar: Command) -> Result<(), Box<dyn std::error::Error>> {
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

    Ok(())
}
