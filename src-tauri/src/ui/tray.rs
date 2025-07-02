use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder},
    App, Manager,
};

use crate::error::Result;

#[allow(dead_code)]
pub fn setup_tray(app: &mut App) -> Result<()> {
    let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)
        .map_err(|e| crate::error::LempifyError::SystemError(e.to_string()))?;

    let menu = Menu::with_items(app, &[&quit_i])
        .map_err(|e| crate::error::LempifyError::SystemError(e.to_string()))?;

    TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "quit" => {
                #[cfg(debug_assertions)]
                //println!("quit menu item was clicked");
                app.exit(0);
            }
            _ => {
                //#[cfg(debug_assertions)]
                //println!("menu item {:?} not handled", event.id);
            }
        })
        .on_tray_icon_event(|tray, event| {
            match event {
                tauri::tray::TrayIconEvent::Click {
                    button: MouseButton::Left,
                    button_state: MouseButtonState::Up,
                    ..
                } => {
                    let app = tray.app_handle();
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
                _ => {}
            }
        })
        .build(app)
        .map_err(|e| crate::error::LempifyError::SystemError(e.to_string()))?;

    Ok(())
}
