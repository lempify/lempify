use std::fs;
use std::path::Path;
use std::process::Command;

/**
 * Is PHP running?
 *
 * This function checks if PHP is running.
 *
 * @return bool
 */
pub fn is_php_running() -> bool {
    let is_running = Command::new("brew")
        .args(&["services", "list"])
        .output()
        .map(|o| String::from_utf8_lossy(&o.stdout).contains("php       started"))
        .unwrap_or(false);

    is_running
}
/**
 * Ensure the PHP socket path exists
 *
 * This function ensures that the PHP socket path exists.
 * If it does not exist, it will be created with the correct permissions.
 *
 * @return Result<(), String>
 */
pub fn ensure_php_socket_path_exists() -> Result<(), String> {
    let socket_dir = "/opt/homebrew/var/run/php";

    let path = Path::new(socket_dir);

    if !path.exists() {
        fs::create_dir_all(path)
            .map_err(|e| format!("Failed to create socket directory: {}", e))?;
        println!("✅ Created PHP socket path");

        // Set ownership to current user (non-root install only)
        let username = whoami::username();
        println!("Setting ownership of socket directory to {}", username);
        Command::new("chown")
            .arg(username)
            .arg(socket_dir)
            .status()
            .map_err(|e| format!("Failed to chown socket directory: {}", e))?;

        let is_running = is_php_running();

        if is_running {
            // ✅ Restart PHP to apply change
            println!("♻️ Restarting PHP service to apply socket path...");
            Command::new("brew")
                .args(&["services", "restart", "php"])
                .status()
                .map_err(|e| format!("Failed to restart PHP service: {}", e))?;
        }
    } else {
        println!("✅ Verified PHP socket path exists and is owned by current user");
    }

    Ok(())
}

/**
 * Patch the PHP FPM socket configuration
 *
 * This function patches the PHP FPM socket configuration to use the correct socket path.
 *
 * @return Result<(), String>
 */
pub fn patch_php_fpm_socket_conf() -> Result<(), String> {
    // TODO: Make this dynamic based on the PHP version
    let config_path = "/opt/homebrew/etc/php/8.4/php-fpm.d/www.conf";

    let contents = fs::read_to_string(config_path)
        .map_err(|e| format!("Failed to read PHP config: {}", e))?;

    // Avoid double patching
    if contents.contains("/opt/homebrew/var/run/php/php-fpm.sock") {
        println!("✅ PHP FPM socket configuration already patched");
        return Ok(()); // Already patched
    }

    let patched = contents
        .lines()
        .map(|line| {
            if line.trim_start().starts_with("listen =") {
                "listen = /opt/homebrew/var/run/php/php-fpm.sock"
            } else {
                line
            }
        })
        .collect::<Vec<_>>()
        .join("\n");

    println!("Patching PHP FPM socket configuration...");
    
    fs::write(config_path, patched)
        .map_err(|e| format!("Failed to write patched PHP config: {}", e))?;
    
    println!("✅ PHP FPM socket configuration patched");

    Ok(())
}