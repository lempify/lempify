use tauri::{App, Manager};
use std::fs::OpenOptions;
use std::io::Write;

pub fn log_to_file(message: &str) {
    if let Ok(mut file) = OpenOptions::new()
        .create(true)
        .append(true)
        .open("/tmp/lempify.log") 
    {
        let _ = writeln!(file, "[{}] {}", chrono::Utc::now(), message);
    }
}

pub fn open_devtools(app: &App) {
    let window = app.get_webview_window("main").unwrap();
    #[cfg(debug_assertions)]
    {
        // Try to open devtools in debug builds
        window.open_devtools();
        window.close_devtools();
    }
    
    #[cfg(not(debug_assertions))]
    {
        // In release builds, log to file instead
        log_to_file("Devtools not available in release build - using file logging");
    }
}

pub fn close_devtools(app: &App) {
    let window = app.get_webview_window("main").unwrap();
    #[cfg(debug_assertions)]
    {
        window.close_devtools();
    }
    
    #[cfg(not(debug_assertions))]
    {
        log_to_file("Devtools close requested in release build");
    }
}
