pub mod composer;
pub mod config;
pub mod error;
pub mod isolation;
pub mod mailpit;
pub mod memcached;
pub mod mkcert;
pub mod mysql;
pub mod nginx;
pub mod php;
pub mod redis;
pub mod wp_cli;

use crate::models::Service;

/// Returns all available services
pub fn get_all_services() -> Vec<Box<dyn Service>> {
    vec![
        // Services
        Box::new(php::Service::new("8.4").expect("Failed to create PHP service")),
        Box::new(nginx::Service::new("1.27").expect("Failed to create NGINX service")),
        Box::new(mysql::Service::new("9.2").expect("Failed to create MySQL service")),
        Box::new(redis::Service::new("8.2").expect("Failed to create Redis service")),
        Box::new(memcached::Service::new("1.6").expect("Failed to create Memcached service")),
        // Tools
        Box::new(composer::Service::new("2.8").expect("Failed to create Composer service")),
        Box::new(mailpit::Service::new("1.27").expect("Failed to create Mailpit service")),
        Box::new(wp_cli::Service::new("2.12").expect("Failed to create WP-CLI service")),
        Box::new(mkcert::Service::new("1.4").expect("Failed to create mkcert service")),
    ]
}
