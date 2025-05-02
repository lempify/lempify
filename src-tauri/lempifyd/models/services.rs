use crate::service;

pub struct Services {
    pub php: service::php::PhpServiceController,
    pub nginx: service::nginx::NginxServiceController,
    // pub mysql: service::db::MysqlServiceController,
    // pub mariadb: service::db::MariadbServiceController,
    // pub object_cache: service::object_cache::ObjectCacheServiceController,
}
