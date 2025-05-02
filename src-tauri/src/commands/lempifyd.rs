use tauri::{AppHandle, Emitter};
use crate::helpers::lempifyd;

#[tauri::command]
pub async fn lempifyd<R: tauri::Runtime>(
    app: AppHandle<R>,
    service: String,
    action: String
) -> Result<(), String> {
    let cmd = lempifyd::DaemonCommand { service, action };

    lempifyd::send(&cmd)?;
    println!("[lempify:commands:lempifyd] command {:?}, sent successfully", cmd);

    app.emit("service:sent", serde_json::to_string(&cmd).unwrap()).unwrap();
    println!("[lempify:commands:lempifyd] event emitted successfully {:?}", cmd);

    Ok(())
}
