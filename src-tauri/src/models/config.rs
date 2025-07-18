use shared::file_system::AppFileSystem;
use serde::{Deserialize, Serialize};
use shared::constants::LEMPIFY_SUDOERS_PATH;
use std::fs;
use std::path::Path;
use tauri::State;
use tokio::sync::RwLock;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SiteServices {
    pub php: String,
    pub mysql: String,
    pub nginx: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SiteConfig {
    pub ssl: bool,
    pub root: String,
    pub logs: String,
    pub ssl_key: Option<String>,
    pub ssl_cert: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Site {
    pub name: String,
    pub domain: String,
    pub ssl: bool,
    pub services: SiteServices,
    pub site_type: String,
    pub language: String,
    pub database: String,
    pub site_config: SiteConfig,
    pub path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    #[serde(default)]
    pub sites: Vec<Site>,
    #[serde(default = "Config::check_trusted")]
    pub trusted: bool,
    #[serde(default = "Config::get_version")]
    pub version: String,
    #[serde(default)]
    pub settings: Settings,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            sites: Vec::new(),
            version: env!("CARGO_PKG_VERSION").to_string(),
            trusted: Self::check_trusted(),
            settings: Settings::default(),
        }
    }
}

impl Config {
    fn check_trusted() -> bool {
        Path::new(LEMPIFY_SUDOERS_PATH).exists()
    }

    pub fn refresh_trusted_status(&mut self) {
        self.trusted = Self::check_trusted();
    }

    pub fn get_version() -> String {
        env!("CARGO_PKG_VERSION").to_string()
    }

    pub fn update_settings(&mut self, settings: Settings) {
        self.settings = settings;
    }
}

pub struct SiteBuilder {
    name: Option<String>,
    domain: Option<String>,
    ssl: bool,
    services: Option<SiteServices>,
    site_type: String,
    language: String,
    database: String,
    site_config: Option<SiteConfig>,
    path: Option<String>,
}

impl Default for SiteBuilder {
    fn default() -> Self {
        Self {
            name: None,
            domain: None,
            ssl: false,
            services: None,
            site_type: "vanilla".to_string(),
            language: "php".to_string(),
            database: "mysql".to_string(),
            site_config: None,
            path: None,
        }
    }
}

impl SiteBuilder {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn name<S: Into<String>>(mut self, name: S) -> Self {
        self.name = Some(name.into());
        self
    }

    pub fn domain<S: Into<String>>(mut self, domain: S) -> Self {
        self.domain = Some(domain.into());
        self
    }

    pub fn ssl(mut self, ssl: bool) -> Self {
        self.ssl = ssl;
        self
    }

    pub fn services(mut self, services: SiteServices) -> Self {
        self.services = Some(services);
        self
    }

    pub fn site_type<S: Into<String>>(mut self, site_type: S) -> Self {
        self.site_type = site_type.into();
        self
    }

    pub fn language<S: Into<String>>(mut self, language: S) -> Self {
        self.language = language.into();
        self
    }

    pub fn database<S: Into<String>>(mut self, database: S) -> Self {
        self.database = database.into();
        self
    }

    pub fn site_config(mut self, site_config: SiteConfig) -> Self {
        self.site_config = Some(site_config);
        self
    }

    pub fn path<S: Into<String>>(mut self, path: S) -> Self {
        self.path = Some(path.into());
        self
    }

    pub fn build(self) -> Result<Site, String> {
        let name = self.name.ok_or("Site name is required")?;
        let domain = self.domain.as_ref().unwrap_or(&name).clone();
        let path = self
            .path
            .as_ref()
            .unwrap_or(&format!("/opt/homebrew/var/www/{}", domain))
            .clone();

        let services = self.services.unwrap_or_else(|| SiteServices {
            php: "8.4".to_string(),
            mysql: "8.0".to_string(),
            nginx: "1.25".to_string(),
        });

        let site_config = self.site_config.unwrap_or_else(|| SiteConfig {
            ssl: self.ssl,
            root: path.to_string(),
            logs: format!("{}/logs", path),
            ssl_key: if self.ssl {
                Some(format!("/opt/homebrew/etc/nginx/ssl/{}-key.pem", domain))
            } else {
                None
            },
            ssl_cert: if self.ssl {
                Some(format!("/opt/homebrew/etc/nginx/ssl/{}.pem", domain))
            } else {
                None
            },
        });

        Ok(Site {
            name,
            domain,
            ssl: self.ssl,
            services,
            site_type: self.site_type,
            language: self.language,
            database: self.database,
            site_config,
            path,
        })
    }
}

pub struct ConfigManagerBuilder {
    config_file: Option<String>,
}

impl Default for ConfigManagerBuilder {
    fn default() -> Self {
        Self { config_file: None }
    }
}

impl ConfigManagerBuilder {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn config_file<S: Into<String>>(mut self, config_file: S) -> Self {
        self.config_file = Some(config_file.into());
        self
    }

    pub fn build(self) -> Result<ConfigManager, String> {
        let config_file = self
            .config_file
            .unwrap_or_else(|| "config.json".to_string());
        ConfigManager::new(config_file)
    }
}

pub struct ConfigManager {
    pub config_path: std::path::PathBuf,
    config: RwLock<Config>,
}

impl ConfigManager {
    pub fn new(config_file: String) -> Result<Self, String> {
        let config_path = AppFileSystem::new()?.config_dir.join(config_file);
        let config = Self::load_config(&config_path)?;

        Ok(Self {
            config_path,
            config: RwLock::new(config),
        })
    }

    fn load_config(config_path: &Path) -> Result<Config, String> {
        if !config_path.exists() {
            let default_config = Config::default();
            let json = serde_json::to_string_pretty(&default_config)
                .map_err(|e| format!("Failed to serialize default config: {}", e))?;
            fs::write(config_path, json)
                .map_err(|e| format!("Failed to write default config: {}", e))?;
            Ok(default_config)
        } else {
            let content = fs::read_to_string(config_path)
                .map_err(|e| format!("Failed to read config file: {}", e))?;
            let mut config: Config = serde_json::from_str(&content)
                .map_err(|e| format!("Failed to parse config JSON: {}", e))?;
            config.refresh_trusted_status();
            Ok(config)
        }
    }

    async fn save_config(&self) -> Result<(), String> {
        let config = self.config.read().await;
        let json = serde_json::to_string_pretty(&*config)
            .map_err(|e| format!("Failed to serialize config: {}", e))?;
        fs::write(&self.config_path, json)
            .map_err(|e| format!("Failed to write config file: {}", e))?;
        Ok(())
    }

    pub async fn with_config<F, T>(&self, f: F) -> Result<T, String>
    where
        F: FnOnce(&mut Config) -> Result<T, String>,
    {
        let mut config = self.config.write().await;
        let result = f(&mut config)?;
        drop(config);
        self.save_config().await?;
        Ok(result)
    }

    pub async fn with_config_read<F, T>(&self, f: F) -> Result<T, String>
    where
        F: FnOnce(&Config) -> Result<T, String>,
    {
        let config = self.config.read().await;
        let result = f(&config)?;
        Ok(result)
    }

    pub async fn create_site(&self, site: &Site) -> Result<(), String> {
        self.with_config(|config| {
            // Check if site already exists
            if config.sites.iter().any(|s| s.domain == site.domain) {
                return Err(format!("Site with domain '{}' already exists", site.domain));
            }
            config.sites.push(site.clone());
            Ok(())
        }).await
    }

    pub async fn get_site(&self, domain: &str) -> Option<Site> {
        self.with_config_read(|config| {
            Ok(config.sites.iter().find(|s| s.domain == domain).cloned())
        }).await.ok().flatten()
    }

    pub async fn get_all_sites(&self) -> Vec<Site> {
        self.with_config_read(|config| {
            Ok(config.sites.clone())
        }).await.unwrap_or_default()
    }

    pub async fn update_site(&self, domain: &str, updated_site: Site) -> Result<(), String> {
        self.with_config(|config| {
            if let Some(site) = config.sites.iter_mut().find(|s| s.domain == domain) {
                *site = updated_site;
                Ok(())
            } else {
                Err(format!("Site with domain '{}' not found", domain))
            }
        }).await
    }

    pub async fn delete_site(&self, domain: &str) -> Result<Site, String> {
        self.with_config(|config| {
            if let Some(pos) = config.sites.iter().position(|s| s.domain == domain) {
                let removed_site = config.sites.remove(pos);
                Ok(removed_site)
            } else {
                Err(format!("Site with domain '{}' not found", domain))
            }
        }).await
    }

    pub async fn get_config(&self) -> Config {
        self.with_config_read(|config| {
            Ok(config.clone())
        }).await.unwrap_or_default()
    }

    pub async fn refresh_trusted_status(&self) -> Result<bool, String> {
        self.with_config(|config| {
            config.refresh_trusted_status();
            Ok(config.trusted)
        }).await
    }

    pub async fn is_trusted(&self) -> bool {
        self.with_config_read(|config| {
            Ok(config.trusted)
        }).await.unwrap_or(false)
    }

    pub async fn set_trusted(&self, trusted: bool) -> Result<(), String> {
        self.with_config(|config| {
            config.trusted = trusted;
            Ok(())
        }).await
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Settings {
    pub mysql_host: String,
    pub mysql_user: String,
    pub mysql_password: String,
    pub mysql_port: u16,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            mysql_host: "127.0.0.1".to_string(),
            mysql_user: "root".to_string(),
            mysql_password: "root".to_string(),
            mysql_port: 3306,
        }
    }
}

#[tauri::command]
pub async fn create_site_config(
    config_manager: State<'_, ConfigManager>,
    site: Site,
) -> Result<String, String> {
    config_manager.create_site(&site).await?;
    Ok(format!("Site '{}' created successfully", site.domain))
}

#[tauri::command]
pub async fn get_site_config(
    config_manager: State<'_, ConfigManager>,
    domain: String,
) -> Result<Site, String> {
    config_manager
        .get_site(&domain)
        .await
        .ok_or_else(|| format!("Site with domain '{}' not found", domain))
}

#[tauri::command]
pub async fn get_all_sites_config(
    config_manager: State<'_, ConfigManager>,
) -> Result<Vec<Site>, String> {
    Ok(config_manager.get_all_sites().await)
}

#[tauri::command]
pub async fn update_site_config(
    config_manager: State<'_, ConfigManager>,
    domain: String,
    site: Site,
) -> Result<String, String> {
    config_manager.update_site(&domain, site).await?;
    Ok(format!("Site '{}' updated successfully", domain))
}

#[tauri::command]
pub async fn delete_site_config(
    config_manager: State<'_, ConfigManager>,
    domain: String,
) -> Result<String, String> {
    let removed_site = config_manager.delete_site(&domain).await?;
    Ok(format!(
        "Site '{}' deleted successfully",
        removed_site.domain
    ))
}

#[tauri::command]
pub async fn get_config(config_manager: State<'_, ConfigManager>) -> Result<Config, String> {
    Ok(config_manager.get_config().await)
}

#[tauri::command]
pub async fn refresh_trusted_status_config(
    config_manager: State<'_, ConfigManager>,
) -> Result<bool, String> {
    config_manager.refresh_trusted_status().await
}

#[tauri::command]
pub async fn is_trusted_config(config_manager: State<'_, ConfigManager>) -> Result<bool, String> {
    Ok(config_manager.is_trusted().await)
}

#[tauri::command]
pub async fn update_settings(
    config_manager: State<'_, ConfigManager>,
    settings: Settings,
) -> Result<(), String> {
    let mut config = config_manager.config.write().await;
    config.update_settings(settings);
    drop(config);
    config_manager.save_config().await
}
