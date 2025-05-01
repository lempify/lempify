use tauri::{AppHandle, Emitter};
use crate::helpers::lempifyd;

#[tauri::command]
pub async fn lempifyd<R: tauri::Runtime>(
    app: AppHandle<R>,
    service: String,
    action: String
) -> Result<(), String> {
    let cmd = lempifyd::DaemonCommand { service, action };

    println!("🔍 Debug: About to send command: {:?}", cmd);
    lempifyd::send(&cmd)?;
    println!("✅ Debug: Command sent successfully");

    println!("🔍 Debug: About to emit event: {:?}", cmd);
    // Debug print the serialized payload
    println!("🔍 Debug: Serialized payload: {}", serde_json::to_string(&cmd).unwrap());
    app.emit("service:sent", serde_json::to_string(&cmd).unwrap()).unwrap();
    println!("✅ Debug: Event emitted successfully");

    Ok(())
}
