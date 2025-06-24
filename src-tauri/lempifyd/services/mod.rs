pub mod error;
pub mod isolation;
pub mod config;
pub mod php;
pub mod nginx;
pub mod mysql;

pub use php::PhpService;
pub use nginx::NginxService;
pub use mysql::MysqlService;

use crate::models::Service;

/// Returns all available services
pub fn get_all_services() -> Vec<Box<dyn Service>> {
    vec![
        Box::new(PhpService::new("8.4").expect("Failed to create PHP service")),
        Box::new(NginxService::new("1.27").expect("Failed to create NGINX service")),
        Box::new(MysqlService::new("9.2").expect("Failed to create MySQL service")),
    ]
}
