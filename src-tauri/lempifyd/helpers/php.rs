use std::fs;
use std::path::PathBuf;
use users::get_current_groupname;

/**
 * Generates a custom php-fpm.conf for the given version.
 * Returns the path to the generated file.
 */
pub fn generate_fpm_config(version: &str) -> Result<PathBuf, String> {
    let home_dir = dirs::home_dir().ok_or("❌ Could not find home directory")?;
    let config_dir = home_dir.join(".lempify").join("php").join(version);

    // Ensure the directory exists
    fs::create_dir_all(&config_dir)
        .map_err(|e| format!("❌ Could not create config dir: {}", e))?;

    let log_dir = home_dir.join(".lempify").join("logs");
    fs::create_dir_all(&log_dir)
        .map_err(|e| format!("❌ Could not create logs dir: {}", e))?;

    let socket_path = format!("/tmp/lempify-php-{}.sock", version);
    let log_path = log_dir.join(format!("php-fpm-{}.log", version));

    let mut config_content = format!(
r#"
[global]
error_log = {}

[www]
listen = {}
pm = dynamic
pm.max_children = 5
pm.start_servers = 2
pm.min_spare_servers = 1
pm.max_spare_servers = 3
"#,
        log_path.display(),
        socket_path,
    );

    if whoami::username() == "root" {
        let user = whoami::username();
        let group = get_current_groupname().unwrap_or_default().to_string_lossy().to_string();
        config_content.push_str(&format!("listen.owner = {}\nlisten.group = {}\n", user, group));
        config_content.push_str(&format!("user = {}\ngroup = {}\n", user, group));
    }

    let config_path = config_dir.join("php-fpm.conf");

    fs::write(&config_path, config_content)
        .map_err(|e| format!("❌ Failed to write php-fpm.conf: {}", e))?;

    Ok(config_path)
}
