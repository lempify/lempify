use mysql::prelude::*;

use crate::helpers::{config::get_settings, utils::get_mysql_connection};

pub async fn wordpress(site_name: &str, site_tld: &str) -> Result<(), String> {
    // just need to delete the database.
    let mysql_db_name = format!("{}-{}", site_name, site_tld);

    let mysql_db_drop_query = format!("DROP DATABASE IF EXISTS `{}`", mysql_db_name);
    let settings = get_settings().await;

    let mut mysql_conn = get_mysql_connection(
        settings.mysql_host,
        settings.mysql_user,
        settings.mysql_password,
        settings.mysql_port,
    )?;

    mysql_conn
        .query_drop(mysql_db_drop_query)
        .map_err(|e| format!("Failed to drop database: {}", e))?;

    Ok(())
}
