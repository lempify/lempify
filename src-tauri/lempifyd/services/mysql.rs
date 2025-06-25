use shared::brew;
use shared::file_system::AppFileSystem;

use crate::models::Service;
use crate::services::error::ServiceError;
use crate::services::isolation::ServiceIsolation;
use crate::services::config::ServiceConfig;

pub struct MysqlService {
    version: String,
    isolation: ServiceIsolation,
    config: ServiceConfig,
}

impl MysqlService {
    pub fn new(version: &str) -> Result<Self, ServiceError> {
        let file_system = AppFileSystem::new()
            .map_err(|e| ServiceError::FileSystemError(e.to_string()))?;
        let isolation = ServiceIsolation::new("mysql")?;
        let config = ServiceConfig::new(
            file_system,
            "mysql".to_string(),
            version.to_string(),
        )?;

        Ok(Self {
            version: version.to_string(),
            isolation,
            config,
        })
    }

    fn generate_mysql_config(&self) -> String {
        let socket_path = self.isolation.get_socket_path();
        let log_path = self.isolation.get_log_path();
        let data_path = self.isolation.get_config_path().join("data");
        
        format!(
            r#"[mysqld]
# Basic Settings
user = {}
port = 3306
socket = {}
pid_file = /opt/homebr/var/run/mysqld/mysqld.pid

# Data Directory
datadir = {}

# Logging
log_error = {}/error.log
slow_query_log = 1
slow_query_log_file = {}/slow.log
long_query_time = 2

# InnoDB Settings
innodb_buffer_pool_size = 256M
innodb_log_file_size = 64M
innodb_flush_log_at_trx_commit = 2
innodb_flush_method = O_DIRECT

# Connection Settings
max_connections = 151
max_allowed_packet = 64M

# Character Set
character_set_server = utf8mb4
collation_server = utf8mb4_unicode_ci

# Cache Settings
query_cache_type = 1
query_cache_size = 16M
table_open_cache = 400

# MyISAM Settings
key_buffer_size = 32M
myisam_sort_buffer_size = 8M

# Other Settings
tmp_table_size = 32M
max_heap_table_size = 32M
"#,
            whoami::username(),
            socket_path.display(),
            data_path.display(),
            log_path.display(),
            log_path.display(),
        )
    }

    fn setup_config(&self) -> Result<(), ServiceError> {
        // Ensure all required paths exist
        self.isolation.ensure_paths()?;

        // Create data directory
        let data_path = self.isolation.get_config_path().join("data");
        self.config.create_dir(&data_path)?;

        // Generate and write MySQL config
        // let config_content = self.generate_mysql_config();
        // self.config.write_config(&config_content)?;

        Ok(())
    }

    fn initialize_database(&self) -> Result<(), ServiceError> {
        let data_path = self.isolation.get_config_path().join("data");
        
        // Only initialize if data directory is empty
        if data_path.read_dir().map_err(|e| ServiceError::FileSystemError(e.to_string()))?.count() == 0 {
            self.isolation
                .brew_command(&["mysql_install_db", "--datadir", data_path.to_str().unwrap()])
                .run()
                .map_err(|e| ServiceError::ServiceError(format!("Failed to initialize database: {}", e)))?;
        }

        Ok(())
    }
}

impl Service for MysqlService {
    fn name(&self) -> &str {
        "mysql"
    }

    fn version(&self) -> &str {
        &self.version
    }

    fn isolation(&self) -> &ServiceIsolation {
        &self.isolation
    }

    fn is_installed(&self) -> bool {
        brew::is_service_installed("mysql")
    }

    fn is_running(&self) -> bool {
        brew::is_service_running("mysql")
    }

    fn install(&self) -> Result<bool, ServiceError> {
        if self.is_installed() {
            return Ok(true);
        }

        self.isolation
            .brew_command(&["install", &format!("mysql@{}", self.version)])
            .run()
            .map_err(|e| ServiceError::BrewError(e.to_string()))?;

        // Set up initial configuration after install
        self.setup_config()?;
        
        // Initialize the database
        self.initialize_database()?;

        Ok(true)
    }

    fn start(&self) -> Result<bool, ServiceError> {
        if !self.is_installed() {
            return Err(ServiceError::NotInstalled(format!("MySQL {}", self.version)));
        }

        if self.is_running() {
            return Err(ServiceError::AlreadyRunning(format!("MySQL {}", self.version)));
        }

        // Ensure configuration is up to date before starting
        self.setup_config()?;

        self.isolation
            .brew_command(&["services", "start", "mysql"])
            .run()
            .map_err(|e| ServiceError::BrewError(e.to_string()))?;

        Ok(true)
    }

    fn stop(&self) -> Result<bool, ServiceError> {
        if !self.is_running() {
            return Err(ServiceError::NotRunning(format!("MySQL {}", self.version)));
        }

        self.isolation
            .brew_command(&["services", "stop", "mysql"])
            .run()
            .map_err(|e| ServiceError::BrewError(e.to_string()))?;

        Ok(true)
    }

    fn restart(&self) -> Result<bool, ServiceError> {
        if !self.is_installed() {
            return Err(ServiceError::NotInstalled(format!("MySQL {}", self.version)));
        }

        // Ensure configuration is up to date before restarting
        self.setup_config()?;

        self.isolation
            .brew_command(&["services", "restart", "mysql"])
            .run()
            .map_err(|e| ServiceError::BrewError(e.to_string()))?;

        Ok(true)
    }
}
