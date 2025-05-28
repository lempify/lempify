use tauri::{App, Manager};

pub fn open_devtools(app: &App) {
    let window = app.get_webview_window("main").unwrap();
    window.open_devtools();
    window.close_devtools();
}

