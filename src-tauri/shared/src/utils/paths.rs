use std::{fs, path::PathBuf};

/**
 * Get the output directory
 * 
 * @TODO consider placement of this fn. This references a Lempify directory, should be in main tauri app.
 */
pub fn get_output() -> Result<PathBuf, String> {
    let home = dirs::home_dir().ok_or("Could not get home directory")?;
    let home_dir = home.join("Lempify");
    Ok(home_dir)
}

/**
 * Get a directory in the output directory
 */
pub fn get_home_dir(dir: &str) -> Result<PathBuf, String> {
    let home_dir = get_output()?;
    let dir_path = home_dir.join(dir);

    if !dir_path.exists() {
        fs::create_dir_all(&dir_path)
            .map_err(|e| format!("Failed to create {} dir: {e}", dir_path.display()))?;
    }

    Ok(dir_path)
}

/**
 * Get the sites directory
 */
pub fn get_sites() -> Result<PathBuf, String> {
    get_home_dir("sites")
}

/**
 * Get the nginx directory
 */
pub fn get_nginx() -> Result<PathBuf, String> {
    get_home_dir("nginx")
}

/**
 * Get the certs directory
 */
pub fn get_certs() -> Result<PathBuf, String> {
    get_home_dir("certs")
}
