use shared::brew;
use shared::file_system::AppFileSystem;

use crate::models::Service as BaseService;
use crate::services::config::ServiceConfig;
use crate::services::error::ServiceError;
use crate::services::isolation::ServiceIsolation;

pub struct Service {
    version: String,
    isolation: ServiceIsolation,
    config: ServiceConfig,
    #[allow(dead_code)]
    supported_versions: Vec<&'static str>,
}

impl Service {
    pub fn new(version: &str) -> Result<Self, ServiceError> {
        let file_system =
            AppFileSystem::new().map_err(|e| ServiceError::FileSystemError(e.to_string()))?;
        let isolation = ServiceIsolation::new("php")?;
        let config = ServiceConfig::new(file_system, "php".to_string(), version.to_string())?;

        let service = Self {
            version: version.to_string(),
            isolation,
            config,
            supported_versions: vec!["8.4", "8.3", "8.2", "8.1", "8.0"],
        };

        // Ensure configuration is set up when service is created
        service.setup_config()?;

        Ok(service)
    }

    fn generate_fpm_config(&self) -> String {
        let socket_path = self
            .isolation
            .get_service_socket_dir_no_spaces()
            .join(format!("php-{}.sock", self.version));
        let log_path = self.isolation.get_service_log_dir().join("php-fpm.log");
        let pid_path = format!("/opt/homebrew/var/run/php-fpm-{}.pid", self.version);

        format!(
            r#"[global]
pid = {}
error_log = {}
daemonize = yes

[www]
listen = {}
listen.mode = 0666
pm = dynamic
pm.max_children = 5
pm.start_servers = 2
pm.min_spare_servers = 1
pm.max_spare_servers = 3
"#,
            pid_path,
            log_path.display(),
            socket_path.display(),
        )
    }

    fn setup_config(&self) -> Result<(), ServiceError> {
        // Ensure all required paths exist
        self.isolation.ensure_paths()?;

        // Generate and write FPM config
        let config_content = self.generate_fpm_config();
        let config_path = self.isolation.get_service_config_dir().join("php-fpm.conf");

        self.config.write_file(&config_path, &config_content)?;

        Ok(())
    }
}

impl BaseService for Service {
    fn name(&self) -> &str {
        "php"
    }

    fn human_name(&self) -> &str {
        "PHP"
    }

    fn url(&self) -> &str {
        #[cfg(target_os = "macos")]
        {
            "https://formulae.brew.sh/formula/php"
        }
        #[cfg(target_os = "linux")]
        {
            "https://www.php.net/"
        }
    }

    fn is_required(&self) -> bool {
        true
    }

    fn get_type(&self) -> &str {
        "service"
    }

    fn version(&self) -> &str {
        &self.version
    }

    fn isolation(&self) -> Option<&ServiceIsolation> {
        Some(&self.isolation)
    }

    fn is_installed(&self) -> bool {
        brew::is_service_installed("php")
    }

    fn is_running(&self) -> bool {
        // Check if our isolated PHP-FPM process is running
        let socket_path = self
            .isolation
            .get_service_socket_dir_no_spaces()
            .join(format!("php-{}.sock", self.version));

        // Check if socket exists and is accessible
        if !socket_path.exists() {
            return false;
        }

        match std::os::unix::net::UnixStream::connect(&socket_path) {
            Ok(_) => true,
            Err(_) => false,
        }
    }

    fn install(&self) -> Result<bool, ServiceError> {
        if self.is_installed() {
            return Ok(true);
        }

        self.isolation
            .brew_command(&["install", &format!("php@{}", self.version)])
            .run()
            .map_err(|e| ServiceError::BrewError(e.to_string()))?;

        // Set up initial configuration after install
        self.setup_config()?;

        Ok(true)
    }

    fn start(&self) -> Result<bool, ServiceError> {
        if !self.is_installed() {
            return Err(ServiceError::NotInstalled(format!("PHP {}", self.version)));
        }

        if self.is_running() {
            return Err(ServiceError::AlreadyRunning(format!(
                "PHP {}",
                self.version
            )));
        }

        // Ensure configuration is up to date before starting
        self.setup_config()?;

        // Ensure the socket directory exists
        let socket_path = self
            .isolation
            .get_service_socket_dir_no_spaces()
            .join(format!("php-{}.sock", self.version));
        if let Some(socket_dir) = socket_path.parent() {
            self.config.file_system.create_dir_all(socket_dir).map_err(|e| {
                ServiceError::ServiceError(format!("Failed to create socket directory: {}", e))
            })?;
        }

        // Remove any existing socket file
        if socket_path.exists() {
            let _ = std::fs::remove_file(&socket_path);
        }

        // Start PHP-FPM using our isolated config directly
        let config_path = self.isolation.get_service_config_dir().join("php-fpm.conf");

        // Find the php-fpm binary
        let php_fpm_binary = {
            let version_specific = format!("/opt/homebrew/bin/php-fpm{}", self.version);
            if std::path::Path::new(&version_specific).exists() {
                version_specific
            } else if std::path::Path::new("/opt/homebrew/bin/php-fpm").exists() {
                "/opt/homebrew/bin/php-fpm".to_string()
            } else if std::path::Path::new("/opt/homebrew/sbin/php-fpm").exists() {
                "/opt/homebrew/sbin/php-fpm".to_string()
            } else {
                match std::process::Command::new("which").arg("php-fpm").output() {
                    Ok(output) if output.status.success() => {
                        String::from_utf8_lossy(&output.stdout).trim().to_string()
                    }
                    _ => {
                        return Err(ServiceError::ServiceError(
                            "Could not find php-fpm binary".to_string(),
                        ));
                    }
                }
            }
        };

        // Start PHP-FPM with our isolated config
        std::process::Command::new(&php_fpm_binary)
            .arg("--fpm-config")
            .arg(&config_path)
            .spawn()
            .map_err(|e| ServiceError::ServiceError(format!("Failed to start PHP-FPM: {}", e)))?;

        // Give the process a moment to start
        std::thread::sleep(std::time::Duration::from_millis(1000));

        // Verify the service is running
        if self.is_running() {
            Ok(true)
        } else {
            Err(ServiceError::ServiceError(
                "PHP-FPM failed to start".to_string(),
            ))
        }
    }

    fn stop(&self) -> Result<bool, ServiceError> {
        if !self.is_running() {
            return Err(ServiceError::NotRunning(format!("PHP {}", self.version)));
        }

        // Kill the process using our PID file
        let pid_file = format!("/opt/homebrew/var/run/php-fpm-{}.pid", self.version);

        if let Ok(pid_content) = std::fs::read_to_string(&pid_file) {
            if let Ok(pid) = pid_content.trim().parse::<u32>() {
                let _ = std::process::Command::new("kill")
                    .arg("-TERM")
                    .arg(pid.to_string())
                    .status();
            }
        }

        // Remove the socket file
        let socket_path = self
            .isolation
            .get_service_socket_dir_no_spaces()
            .join(format!("php-{}.sock", self.version));
        if socket_path.exists() {
            let _ = std::fs::remove_file(&socket_path);
        }

        Ok(true)
    }

    fn restart(&self) -> Result<bool, ServiceError> {
        if !self.is_installed() {
            return Err(ServiceError::NotInstalled(format!("PHP {}", self.version)));
        }

        // Ensure configuration is up to date before restarting
        self.setup_config()?;

        // Stop first
        self.stop()?;

        // Start with new config
        self.start()
    }
}
