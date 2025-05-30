use tauri::{
    menu::{MenuBuilder, SubmenuBuilder},
    App,
};

pub fn build(app: &App) -> Result<(), Box<dyn std::error::Error>> {
    let submenu = SubmenuBuilder::new(app, "Sub")
        .text("tauri_id", "Tauri")
        .separator()
        .check("is_awesome", "Is Awesome")
        .build()?;
    let menu = MenuBuilder::new(app).item(&submenu).build()?;
    app.set_menu(menu)?;
    // @TODO: Unused
    app.on_menu_event(move |_app, _event| {});
    Ok(())
}
