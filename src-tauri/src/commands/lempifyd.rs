use crate::helpers::lempifyd;
use tauri::{AppHandle, Emitter};

#[tauri::command]
pub async fn lempifyd<R: tauri::Runtime>(
    app: AppHandle<R>,
    name: String,
    action: String,
) -> Result<(), String> {
    let cmd = lempifyd::DaemonCommand {
        name: name.clone(),
        action: action.clone(),
    };
    let response = lempifyd::send(&cmd)?;

    // Emit the command that was sent
    app.emit("lempifyd:send", serde_json::to_string(&cmd).unwrap())
        .unwrap();

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
