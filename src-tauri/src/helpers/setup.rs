use std::fs;

use shared::dirs::get_config;

fn create_site_dirs() -> Result<(), String> {
    let lempify_dir = get_config()
        .unwrap()
        .join("Lempify");

    // If `~/.config/lempify` exists, setup has already been run.
    if lempify_dir.exists() {
        //println!("◯ Lempify dirs exist: {}", lempify_dir.display());
        return Ok(());
    }

    // Create `~/.config/lempify`
    fs::create_dir_all(&lempify_dir)
        .map_err(|e| format!("Failed to create {} dir: {e}", lempify_dir.display()))?;

    let dirs = [
        lempify_dir.join("sites"),
        lempify_dir.join("nginx"),
        lempify_dir.join("certs")
    ];

    for dir in dirs {
        // Create `~/.config/lempify/{dir}`
        fs::create_dir_all(&dir)
            .map_err(|e| format!("Failed to create {} dir: {e}", dir.display()))?;
    }

    Ok(())
}

/**
 * Run the setup process
 */
pub fn run() -> Result<(), String> {
    create_site_dirs()?;

    Ok(())
}