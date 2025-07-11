use crate::models::config::{Config, ConfigManager, Settings, Site};

pub async fn get_config() -> Config {
    let config_manager = ConfigManager::new(String::from("config.json")).unwrap();
    config_manager.get_config().await
}

pub async fn get_settings() -> Settings {
    let config = get_config().await;
    config.settings
}

#[allow(dead_code)]
pub async fn get_sites() -> Vec<Site> {
    let config = get_config().await;
    config.sites
}