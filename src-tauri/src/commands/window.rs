use tauri::{WebviewUrl, WebviewWindowBuilder};

#[tauri::command]
pub async fn open_site_window(
    app_handle: tauri::AppHandle,
    domain: String,
    ssl: bool,
) -> Result<(), String> {
    let url = if ssl {
        format!("https://{}", domain)
    } else {
        format!("http://{}", domain)
    };

    let window_label = format!("site-{}", domain.replace(".", "-"));
    
    WebviewWindowBuilder::new(
        &app_handle,
        window_label,
        WebviewUrl::External(url.parse().map_err(|e| format!("Invalid URL: {}", e))?)
    )
    .title(format!("{} - Lempify", domain))
    .inner_size(1200.0, 800.0)
    .center()
    .visible(true)
    .build()
    .map_err(|e| format!("Failed to create window: {}", e))?;

    Ok(())
}
/* 
#[tauri::command]
pub async fn open_site_window_with_screenshot(
    app_handle: tauri::AppHandle,
    domain: String,
    ssl: bool,
) -> Result<String, String> {
    let url = if ssl {
        format!("https://{}", domain)
    } else {
        format!("http://{}", domain)
    };

    let window_label = format!("site-{}", domain.replace(".", "-"));
    
    let window = WebviewWindowBuilder::new(
        &app_handle,
        window_label,
        WebviewUrl::External(url.parse().map_err(|e| format!("Invalid URL: {}", e))?)
    )
    .title(format!("{} - Lempify", domain))
    .inner_size(1200.0, 800.0)
    .center()
    .visible(true)
    .build()
    .map_err(|e| format!("Failed to create window: {}", e))?;

    // Wait for page to load
    tokio::time::sleep(tokio::time::Duration::from_secs(3)).await;

    // Take screenshot using the correct API
    let screenshot = window.capture().map_err(|e| format!("Failed to take screenshot: {}", e))?;
    
    // Save screenshot
    let output_path = format!("/tmp/lempify/screenshots/{}.png", domain);
    std::fs::create_dir_all("/tmp/lempify/screenshots")
        .map_err(|e| format!("Failed to create screenshots directory: {}", e))?;
    
    std::fs::write(&output_path, screenshot)
        .map_err(|e| format!("Failed to save screenshot: {}", e))?;

    Ok(output_path)
} */