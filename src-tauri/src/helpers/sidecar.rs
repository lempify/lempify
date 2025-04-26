/* use tauri::{AppHandle, Manager};

mod ipc; // This assumes you've placed the IPC helper in `src/ipc/mod.rs`
use ipc::client::send_message;

fn setup_sidecar(app: &AppHandle) {
    let sidecar_command = app.shell().sidecar("lempifyd").unwrap();
    let (_rx, _child) = sidecar_command.spawn().expect("Failed to spawn lempifyd daemon");

    println!("🚀 lempifyd daemon started.");

    // Send an initial message via IPC
    match send_message("/tmp/lempifyd.sock", r#"{"action":"start_php","version":"8.3"}"#) {
        Ok(_) => println!("✅ IPC message sent to lempifyd"),
        Err(e) => eprintln!("❌ Failed to send IPC message: {}", e),
    }
}
 */