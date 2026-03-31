use crate::helpers::lempifyd;
use tauri::{AppHandle, Emitter};

#[tauri::command]
pub async fn lempifyd<R: tauri::Runtime>(
    app: AppHandle<R>,
    name: String,
    action: String,
) -> Result<(), String> {
    // Serialize before moving name/action into the blocking task
    let send_payload = serde_json::to_string(
        &serde_json::json!({ "name": &name, "action": &action }),
    )
    .unwrap_or_default();

    let cmd = lempifyd::DaemonCommand { name, action };
    let response = tokio::task::spawn_blocking(move || lempifyd::send(&cmd))
        .await
        .map_err(|e| format!("Task join error: {}", e))??;

    // Emit the command that was sent
    app.emit("lempifyd:send", send_payload).unwrap();

    // If we got a response, emit it as well
    if let Some(response) = response {
        app.emit(
            "lempifyd:response",
            serde_json::to_string(&response).unwrap(),
        )
        .unwrap();
    }

    Ok(())
}