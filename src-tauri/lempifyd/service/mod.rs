pub mod php;
pub mod nginx;

use crate::traits::service_controller::ServiceController;

pub fn get_all_services() -> Vec<Box<dyn ServiceController>> {
    vec![
        Box::new(php::PhpServiceController { version: "8.4".into() }),
        Box::new(nginx::NginxServiceController {}),
    ]
}