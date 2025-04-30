use tauri::{AppHandle, Emitter};
use crate::helpers::lempifyd;

#[tauri::command]
pub async fn control_service<R: tauri::Runtime>(
    app: AppHandle<R>,
    service: String,
    action: String
) -> Result<(), String> {
    let cmd = lempifyd::DaemonCommand { service, action };

    println!("Sending command: {:?}", cmd);

    lempifyd::send(&cmd)?;

    // Emit event back to frontend
    app.emit("service:sent", &cmd).ok();

    Ok(())
}
