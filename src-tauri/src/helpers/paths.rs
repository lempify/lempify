use std::{fs, path::PathBuf};

pub fn get_home_path() -> Result<PathBuf, String> {
    let home = dirs::home_dir().ok_or("Could not get home directory")?;
    let home_dir = home.join("Lempify");
    Ok(home_dir)
}

pub fn get_home_dir(dir: &str) -> Result<PathBuf, String> {
    let home_dir = get_home_path()?;
    let dir_path = home_dir.join(dir);

    if !dir_path.exists() {
        fs::create_dir_all(&dir_path)
            .map_err(|e| format!("Failed to create {} dir: {e}", dir_path.display()))?;
    }

    Ok(dir_path)
}

pub fn get_sites_dir() -> Result<PathBuf, String> {
    get_home_dir("sites")
}

pub fn get_nginx_dir() -> Result<PathBuf, String> {
    get_home_dir("nginx")
}

pub fn get_certs_dir() -> Result<PathBuf, String> {
    get_home_dir("certs")
}
