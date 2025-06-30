use std::fs;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use users::User;

#[derive(Debug, Clone)]
pub struct AppFileSystem {
    /** `/lempify/src-tauri/` */
    pub app_dir: PathBuf,
    /** `/opt/homebrew/var/www/` or `/var/www` */
    pub sites_dir: PathBuf,
    /** `/opt/homebrew/etc/nginx` or `/etc/nginx` */
    pub nginx_dir: PathBuf,
    /** `/opt/homebrew/etc/nginx/sites-enabled` or `/etc/nginx/sites-enabled` */
    pub nginx_sites_enabled_dir: PathBuf,
    /** `/opt/homebrew/etc/nginx/ssl` or `/etc/nginx/ssl` */
    pub certs_dir: PathBuf,
    /** `/lempify/src-tauri/stubs` */
    pub app_stubs_dir: PathBuf,
    /** `~/Library/Application Support/Lempify/` */
    pub config_dir: PathBuf,
    /** `~/Library/Application Support/Lempify/site-types` */
    pub site_types_dir: PathBuf,
}

impl AppFileSystem {
    /**
     * Get and configure app file system.
     *
     * @example
     * ```
     * let file_system = AppFileSystem::new()?;
     * ```
     */
    pub fn new() -> Result<Self, String> {
        let app_dir = env!("CARGO_MANIFEST_DIR");
        // remove shared from path.
        let app_dir = PathBuf::from(app_dir.replace("shared", ""));
        
        let config_dir = dirs::config_dir().ok_or("Could not get config directory")?;
        let config_dir = config_dir.join("Lempify");

        let app_stubs_dir = app_dir.join("stubs");
        let site_types_dir = config_dir.join("site-types");
        
        // Sites directory - standard web server location
        let sites_dir = if cfg!(target_os = "macos") {
            PathBuf::from("/opt/homebrew/var/www")
        } else {
            PathBuf::from("/var/www")
        };
        
        // Nginx directory - standard system location
        let nginx_dir = if cfg!(target_os = "macos") {
            PathBuf::from("/opt/homebrew/etc/nginx")
        } else {
            PathBuf::from("/etc/nginx")
        };

        let nginx_sites_enabled_dir = nginx_dir.join("sites-enabled");
        
        // Certs directory - standard system location
        let certs_dir = if cfg!(target_os = "macos") {
            PathBuf::from("/opt/homebrew/etc/nginx/ssl")
        } else {
            PathBuf::from("/etc/nginx/ssl")
        };
        
        Ok(Self {
            app_dir,
            sites_dir,
            nginx_dir,
            nginx_sites_enabled_dir,
            certs_dir,
            app_stubs_dir,
            config_dir,
            site_types_dir,
        })
    }

    pub fn is_dir(&self, path: &Path) -> bool {
        path.is_dir()
    }

    pub fn is_file(&self, path: &Path) -> bool {
        path.is_file()
    }
    
    pub fn mkdir(&self, path: &Path, owner: &User, mode: u32) -> Result<(), String> {
        // Create directory with sudo
        let _output = Command::new("sudo")
            .args(["-S", "mkdir", "-p", path.to_str().unwrap()])
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .map_err(|e| format!("Failed to create directory: {}", e))?;

        // Set permissions with sudo
        let _output = Command::new("sudo")
            .args(["-S", "chmod", &format!("{:o}", mode), path.to_str().unwrap()])
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .map_err(|e| format!("Failed to set permissions: {}", e))?;

        // Change ownership with sudo
        let _output = Command::new("sudo")
            .args(["-S", "chown", &owner.uid().to_string(), path.to_str().unwrap()])
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .map_err(|e| format!("Failed to change ownership: {}", e))?;

        Ok(())
    }

    pub fn load_json(&self, filename: &str) -> Result<String, String> {
        let config_path = self.config_dir.join(filename);

        let config = if !config_path.exists() {
            fs::write(&config_path, "{}").map_err(|e| e.to_string())?;
            "{}".to_string()
        } else {
            fs::read_to_string(&config_path).map_err(|e| e.to_string())?
        };

        Ok(config)
    }

    pub fn get_config_dir(&self) -> Result<PathBuf, String> {
        Ok(self.config_dir.clone())
    }

    pub fn create_dir_all(&self, path: &Path) -> Result<(), String> {
        fs::create_dir_all(path).map_err(|e| e.to_string())
    }

    pub fn write_file(&self, path: &Path, content: &str) -> Result<(), String> {
        // Ensure parent directory exists
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }

        fs::write(path, content).map_err(|e| e.to_string())
    }

    pub fn read_file(&self, path: &Path) -> Result<String, String> {
        fs::read_to_string(path).map_err(|e| e.to_string())
    }
} 