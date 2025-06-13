use mysql::{Pool, prelude::*};

pub fn wordpress(site_name: &str, site_tld: &str) -> Result<(), String> {
    // just need to delete the database.
    let mysql_db_name = format!("{}-{}", site_name, site_tld);

    let mysql_db_drop_query = format!("DROP DATABASE IF EXISTS `{}`", mysql_db_name);
    // let mysql_db_user_drop_query = format!("DROP USER IF EXISTS `{}`@`{}`", mysql_db_user, mysql_db_host);

    let pool = Pool::new("").map_err(|e| {
        format!("Failed to connect to MySQL: {}", e)
    })?;
    let mut conn = pool.get_conn().map_err(|e| {
        format!("Failed to get MySQL connection: {}", e)
    })?;

    conn.query_drop(mysql_db_drop_query).map_err(|e| {
        format!("Failed to drop database: {}", e)
    })?;
    // conn.query_drop(mysql_db_user_drop_query).map_err(|e| {
    //     format!("Failed to drop user: {}", e)
    // })?;
    println!("Dropped database: {}", mysql_db_name);

    Ok(())
}