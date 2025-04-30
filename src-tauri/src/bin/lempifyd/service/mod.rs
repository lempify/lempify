pub mod php;
pub mod nginx;

use crate::helpers::service_manager::ServiceController;

pub fn get_all_services() -> Vec<Box<dyn ServiceController>> {
    vec![
        Box::new(php::PhpService { version: "8.4".into() }),
        // Box::new(nginx::NginxService {}),
    ]
}