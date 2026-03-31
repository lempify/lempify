use chrono::Utc;
use mysql::prelude::Queryable;
use mysql::Pool;
use regex::Regex;
use serde::{Deserialize, Serialize};
use std::{
    fs::{self, File}, path::PathBuf, process::Command
};
use whoami;

use shared::file_system::AppFileSystem;

use crate::constants;

#[derive(Debug, Serialize, Deserialize)]
pub struct WordPressVersionResponse {
    pub offers: Vec<WordPressOffer>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CachedWordPressVersions {
    pub data: WordPressVersionResponse,
    pub expires: u64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WordPressOffer {
    pub response: String,
    pub download: String,
    pub locale: String,
    pub packages: WordPressPackages,
    pub current: String,
    pub version: String,
    pub php_version: String,
    pub mysql_version: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WordPressPackages {
    pub full: String,
    pub no_content: String,
    pub new_bundled: String,
    pub partial: serde_json::Value,  // Can be false or object
    pub rollback: serde_json::Value, // Can be false or object
}

/**
 * WordPress versions
 *
 * This function will return a list of WordPress versions that are available to install. Cache the value for 1 hour
 *
 * @returns A list of WordPress versions
 */
pub async fn versions() -> Result<WordPressVersionResponse, String> {
    let app_fs = AppFileSystem::new().map_err(|e| e.to_string())?;
    // Check if the cache is valid.
    let cache_path = app_fs.cache_dir.join("wordpress-versions.json");

    // Ensure cache directory always exists before any read or write
    fs::create_dir_all(&app_fs.cache_dir).map_err(|e| e.to_string())?;

    if cache_path.exists() {
        let cache_file = File::open(&cache_path).map_err(|e| e.to_string())?;
        let cache_data: CachedWordPressVersions =
            serde_json::from_reader(cache_file).map_err(|e| e.to_string())?;
        if cache_data.expires > Utc::now().timestamp() as u64 {
            return Ok(cache_data.data);
        }
    }

    println!("Updating WP VERSIONS cache");

    let response = reqwest::get(constants::WP_VERSION_ENDPOINT)
        .await
        .map_err(|e| e.to_string())?;

    let versions = response
        .json::<WordPressVersionResponse>()
        .await
        .map_err(|e| e.to_string())?;

    // Cache the data
    let cache_data = CachedWordPressVersions {
        data: versions,
        expires: Utc::now().timestamp() as u64 + 3600,
    };

    // Write the cache
    let cache_file = File::create(&cache_path).map_err(|e| e.to_string())?;
    serde_json::to_writer_pretty(cache_file, &cache_data).map_err(|e| e.to_string())?;

    Ok(cache_data.data)
}

/**
 * Fix WordPress file permissions and ownership
 *
 * Sets proper ownership and permissions for wp-content and wp-content/uploads directories
 * to allow PHP-FPM to write uploaded files.
 *
 * @param site_dir The path to the WordPress site directory
 * @returns Result<(), String>
 */
pub fn fix_permissions(site_dir: &PathBuf) -> Result<(), String> {
    let wp_content_dir = site_dir.join("wp-content");
    let wp_uploads_dir = wp_content_dir.join("uploads");
    
    // Get current username (the user running PHP-FPM)
    let username = whoami::username();
    
    // Ensure wp-content/uploads directory exists
    if !wp_uploads_dir.exists() {
        fs::create_dir_all(&wp_uploads_dir)
            .map_err(|e| format!("Failed to create wp-content/uploads directory: {}", e))?;
    }
    
    // Set ownership of wp-content directory to current user
    Command::new("chown")
        .arg("-R")
        .arg(&username)
        .arg(&wp_content_dir)
        .status()
        .map_err(|e| format!("Failed to set wp-content ownership: {}", e))?;
    
    // Set permissions to 755 (rwxr-xr-x) for wp-content directory
    let mut perms = fs::metadata(&wp_content_dir)
        .map_err(|e| format!("Failed to get wp-content directory metadata: {}", e))?
        .permissions();
    perms.set_readonly(false);
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        perms.set_mode(0o755);
    }
    fs::set_permissions(&wp_content_dir, perms)
        .map_err(|e| format!("Failed to set wp-content directory permissions: {}", e))?;
    
    // Set permissions to 775 (rwxrwxr-x) for wp-content/uploads directory
    // This allows the web server (PHP-FPM) to write uploaded files
    let mut uploads_perms = fs::metadata(&wp_uploads_dir)
        .map_err(|e| format!("Failed to get wp-content/uploads directory metadata: {}", e))?
        .permissions();
    uploads_perms.set_readonly(false);
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        uploads_perms.set_mode(0o775);
    }
    fs::set_permissions(&wp_uploads_dir, uploads_perms)
        .map_err(|e| format!("Failed to set wp-content/uploads directory permissions: {}", e))?;
    
    println!("wp-content directory ownership and permissions set successfully");
    Ok(())
}

/*
SITE_DIR="/opt/homebrew/var/www/msnow.local" && \
mkdir -p "$SITE_DIR/wp-content/uploads" && \
chown -R $(whoami) "$SITE_DIR/wp-content" && \
chmod 755 "$SITE_DIR/wp-content" && \
chmod 775 "$SITE_DIR/wp-content/uploads"
*/

const WP_USER_ROLES: &str = "a:5:{s:13:\"administrator\";a:2:{s:4:\"name\";s:13:\"Administrator\";s:12:\"capabilities\";a:61:{s:13:\"switch_themes\";b:1;s:11:\"edit_themes\";b:1;s:16:\"activate_plugins\";b:1;s:12:\"edit_plugins\";b:1;s:10:\"edit_users\";b:1;s:10:\"edit_files\";b:1;s:14:\"manage_options\";b:1;s:17:\"moderate_comments\";b:1;s:17:\"manage_categories\";b:1;s:12:\"manage_links\";b:1;s:12:\"upload_files\";b:1;s:6:\"import\";b:1;s:15:\"unfiltered_html\";b:1;s:10:\"edit_posts\";b:1;s:17:\"edit_others_posts\";b:1;s:20:\"edit_published_posts\";b:1;s:13:\"publish_posts\";b:1;s:10:\"edit_pages\";b:1;s:4:\"read\";b:1;s:8:\"level_10\";b:1;s:7:\"level_9\";b:1;s:7:\"level_8\";b:1;s:7:\"level_7\";b:1;s:7:\"level_6\";b:1;s:7:\"level_5\";b:1;s:7:\"level_4\";b:1;s:7:\"level_3\";b:1;s:7:\"level_2\";b:1;s:7:\"level_1\";b:1;s:7:\"level_0\";b:1;s:17:\"edit_others_pages\";b:1;s:20:\"edit_published_pages\";b:1;s:13:\"publish_pages\";b:1;s:12:\"delete_pages\";b:1;s:19:\"delete_others_pages\";b:1;s:22:\"delete_published_pages\";b:1;s:12:\"delete_posts\";b:1;s:19:\"delete_others_posts\";b:1;s:22:\"delete_published_posts\";b:1;s:20:\"delete_private_posts\";b:1;s:18:\"edit_private_posts\";b:1;s:18:\"read_private_posts\";b:1;s:20:\"delete_private_pages\";b:1;s:18:\"edit_private_pages\";b:1;s:18:\"read_private_pages\";b:1;s:12:\"delete_users\";b:1;s:12:\"create_users\";b:1;s:17:\"unfiltered_upload\";b:1;s:14:\"edit_dashboard\";b:1;s:14:\"update_plugins\";b:1;s:14:\"delete_plugins\";b:1;s:15:\"install_plugins\";b:1;s:13:\"update_themes\";b:1;s:14:\"install_themes\";b:1;s:11:\"update_core\";b:1;s:10:\"list_users\";b:1;s:12:\"remove_users\";b:1;s:13:\"promote_users\";b:1;s:18:\"edit_theme_options\";b:1;s:13:\"delete_themes\";b:1;s:6:\"export\";b:1;}}s:6:\"editor\";a:2:{s:4:\"name\";s:6:\"Editor\";s:12:\"capabilities\";a:34:{s:17:\"moderate_comments\";b:1;s:17:\"manage_categories\";b:1;s:12:\"manage_links\";b:1;s:12:\"upload_files\";b:1;s:15:\"unfiltered_html\";b:1;s:10:\"edit_posts\";b:1;s:17:\"edit_others_posts\";b:1;s:20:\"edit_published_posts\";b:1;s:13:\"publish_posts\";b:1;s:10:\"edit_pages\";b:1;s:4:\"read\";b:1;s:7:\"level_7\";b:1;s:7:\"level_6\";b:1;s:7:\"level_5\";b:1;s:7:\"level_4\";b:1;s:7:\"level_3\";b:1;s:7:\"level_2\";b:1;s:7:\"level_1\";b:1;s:7:\"level_0\";b:1;s:17:\"edit_others_pages\";b:1;s:20:\"edit_published_pages\";b:1;s:13:\"publish_pages\";b:1;s:12:\"delete_pages\";b:1;s:19:\"delete_others_pages\";b:1;s:22:\"delete_published_pages\";b:1;s:12:\"delete_posts\";b:1;s:19:\"delete_others_posts\";b:1;s:22:\"delete_published_posts\";b:1;s:20:\"delete_private_posts\";b:1;s:18:\"edit_private_posts\";b:1;s:18:\"read_private_posts\";b:1;s:20:\"delete_private_pages\";b:1;s:18:\"edit_private_pages\";b:1;s:18:\"read_private_pages\";b:1;}}s:6:\"author\";a:2:{s:4:\"name\";s:6:\"Author\";s:12:\"capabilities\";a:10:{s:12:\"upload_files\";b:1;s:10:\"edit_posts\";b:1;s:20:\"edit_published_posts\";b:1;s:13:\"publish_posts\";b:1;s:4:\"read\";b:1;s:7:\"level_2\";b:1;s:7:\"level_1\";b:1;s:7:\"level_0\";b:1;s:12:\"delete_posts\";b:1;s:22:\"delete_published_posts\";b:1;}}s:11:\"contributor\";a:2:{s:4:\"name\";s:11:\"Contributor\";s:12:\"capabilities\";a:5:{s:10:\"edit_posts\";b:1;s:4:\"read\";b:1;s:7:\"level_1\";b:1;s:7:\"level_0\";b:1;s:12:\"delete_posts\";b:1;}}s:10:\"subscriber\";a:2:{s:4:\"name\";s:10:\"Subscriber\";s:12:\"capabilities\";a:2:{s:4:\"read\";b:1;s:7:\"level_0\";b:1;}}}";

pub fn cli_install_site(site_dir: &PathBuf, url: &str, title: &str) -> Result<(), String> {
    let output = Command::new("wp")
        .current_dir(site_dir)
        .arg("core")
        .arg("install")
        .arg(format!("--url={}", url))
        .arg(format!("--title={}", title))
        .arg("--admin_user=admin")
        .arg("--admin_password=password")
        .arg("--admin_email=admin@example.com")
        .arg("--skip-email")
        .output()
        .map_err(|e| format!("Failed to run wp-cli: {}", e))?;

    println!("WP-CLI install output: {:?}", output);

    if !output.status.success() {
        return Err(format!(
            "wp core install failed: {}",
            String::from_utf8_lossy(&output.stderr)
        ));
    }

    Ok(())
}

pub fn read_db_version(wp_version_dir: &PathBuf) -> String {
    let version_php = wp_version_dir.join("wp-includes").join("version.php");
    let contents = match fs::read_to_string(&version_php) {
        Ok(c) => c,
        Err(_) => return "56483".to_string(),
    };
    let re = match Regex::new(r"\$wp_db_version\s*=\s*(\d+)") {
        Ok(r) => r,
        Err(_) => return "56483".to_string(),
    };
    re.captures(&contents)
        .and_then(|caps| caps.get(1))
        .map(|m| m.as_str().to_string())
        .unwrap_or_else(|| "56483".to_string())
}

pub fn setup_database(
    wp_version_dir: &PathBuf,
    site_url: &str,
    title: &str,
    db_name: &str,
    settings: &crate::models::config::Settings,
) -> Result<(), String> {
    let conn_str = format!(
        "mysql://{}:{}@{}:{}/{}",
        settings.mysql_user,
        settings.mysql_password,
        settings.mysql_host,
        settings.mysql_port,
        db_name
    );

    let pool = Pool::new(conn_str.as_str())
        .map_err(|e| format!("Failed to connect to MySQL: {}", e))?;
    let mut conn = pool
        .get_conn()
        .map_err(|e| format!("Failed to get MySQL connection: {}", e))?;

    // Disable strict mode for this session so that zero-date defaults
    // (e.g. '0000-00-00 00:00:00') are accepted by MySQL 8.0+.
    conn.query_drop("SET SESSION sql_mode = 'NO_ENGINE_SUBSTITUTION'")
        .map_err(|e| format!("Failed to set SQL mode: {}", e))?;

    // Create tables
    conn.query_drop(
        "CREATE TABLE IF NOT EXISTS `wp_terms` (
          `term_id` bigint unsigned NOT NULL AUTO_INCREMENT,
          `name` varchar(200) NOT NULL DEFAULT '',
          `slug` varchar(200) NOT NULL DEFAULT '',
          `term_group` bigint NOT NULL DEFAULT 0,
          PRIMARY KEY (`term_id`),
          KEY `slug` (`slug`(191)),
          KEY `name` (`name`(191))
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
    )
    .map_err(|e| format!("Failed to create wp_terms: {}", e))?;

    conn.query_drop(
        "CREATE TABLE IF NOT EXISTS `wp_term_taxonomy` (
          `term_taxonomy_id` bigint unsigned NOT NULL AUTO_INCREMENT,
          `term_id` bigint unsigned NOT NULL DEFAULT 0,
          `taxonomy` varchar(32) NOT NULL DEFAULT '',
          `description` longtext NOT NULL,
          `parent` bigint unsigned NOT NULL DEFAULT 0,
          `count` bigint NOT NULL DEFAULT 0,
          PRIMARY KEY (`term_taxonomy_id`),
          UNIQUE KEY `term_id_taxonomy` (`term_id`,`taxonomy`),
          KEY `taxonomy` (`taxonomy`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
    )
    .map_err(|e| format!("Failed to create wp_term_taxonomy: {}", e))?;

    conn.query_drop(
        "CREATE TABLE IF NOT EXISTS `wp_term_relationships` (
          `object_id` bigint unsigned NOT NULL DEFAULT 0,
          `term_taxonomy_id` bigint unsigned NOT NULL DEFAULT 0,
          `term_order` int NOT NULL DEFAULT 0,
          PRIMARY KEY (`object_id`,`term_taxonomy_id`),
          KEY `term_taxonomy_id` (`term_taxonomy_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
    )
    .map_err(|e| format!("Failed to create wp_term_relationships: {}", e))?;

    conn.query_drop(
        "CREATE TABLE IF NOT EXISTS `wp_termmeta` (
          `meta_id` bigint unsigned NOT NULL AUTO_INCREMENT,
          `term_id` bigint unsigned NOT NULL DEFAULT 0,
          `meta_key` varchar(255) DEFAULT NULL,
          `meta_value` longtext,
          PRIMARY KEY (`meta_id`),
          KEY `term_id` (`term_id`),
          KEY `meta_key` (`meta_key`(191))
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
    )
    .map_err(|e| format!("Failed to create wp_termmeta: {}", e))?;

    conn.query_drop(
        "CREATE TABLE IF NOT EXISTS `wp_commentmeta` (
          `meta_id` bigint unsigned NOT NULL AUTO_INCREMENT,
          `comment_id` bigint unsigned NOT NULL DEFAULT 0,
          `meta_key` varchar(255) DEFAULT NULL,
          `meta_value` longtext,
          PRIMARY KEY (`meta_id`),
          KEY `comment_id` (`comment_id`),
          KEY `meta_key` (`meta_key`(191))
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
    )
    .map_err(|e| format!("Failed to create wp_commentmeta: {}", e))?;

    conn.query_drop(
        "CREATE TABLE IF NOT EXISTS `wp_comments` (
          `comment_ID` bigint unsigned NOT NULL AUTO_INCREMENT,
          `comment_post_ID` bigint unsigned NOT NULL DEFAULT 0,
          `comment_author` tinytext NOT NULL,
          `comment_author_email` varchar(100) NOT NULL DEFAULT '',
          `comment_author_url` varchar(200) NOT NULL DEFAULT '',
          `comment_author_IP` varchar(100) NOT NULL DEFAULT '',
          `comment_date` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
          `comment_date_gmt` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
          `comment_content` text NOT NULL,
          `comment_karma` int NOT NULL DEFAULT 0,
          `comment_approved` varchar(20) NOT NULL DEFAULT '1',
          `comment_agent` varchar(255) NOT NULL DEFAULT '',
          `comment_type` varchar(20) NOT NULL DEFAULT 'comment',
          `comment_parent` bigint unsigned NOT NULL DEFAULT 0,
          `user_id` bigint unsigned NOT NULL DEFAULT 0,
          PRIMARY KEY (`comment_ID`),
          KEY `comment_post_ID` (`comment_post_ID`),
          KEY `comment_approved_date_gmt` (`comment_approved`,`comment_date_gmt`),
          KEY `comment_date_gmt` (`comment_date_gmt`),
          KEY `comment_parent` (`comment_parent`),
          KEY `comment_author_email` (`comment_author_email`(10))
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
    )
    .map_err(|e| format!("Failed to create wp_comments: {}", e))?;

    conn.query_drop(
        "CREATE TABLE IF NOT EXISTS `wp_links` (
          `link_id` bigint unsigned NOT NULL AUTO_INCREMENT,
          `link_url` varchar(255) NOT NULL DEFAULT '',
          `link_name` varchar(255) NOT NULL DEFAULT '',
          `link_image` varchar(255) NOT NULL DEFAULT '',
          `link_target` varchar(25) NOT NULL DEFAULT '',
          `link_description` varchar(255) NOT NULL DEFAULT '',
          `link_visible` varchar(20) NOT NULL DEFAULT 'Y',
          `link_owner` bigint unsigned NOT NULL DEFAULT 1,
          `link_rating` int NOT NULL DEFAULT 0,
          `link_updated` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
          `link_rel` varchar(255) NOT NULL DEFAULT '',
          `link_notes` mediumtext NOT NULL,
          `link_rss` varchar(255) NOT NULL DEFAULT '',
          PRIMARY KEY (`link_id`),
          KEY `link_visible` (`link_visible`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
    )
    .map_err(|e| format!("Failed to create wp_links: {}", e))?;

    conn.query_drop(
        "CREATE TABLE IF NOT EXISTS `wp_options` (
          `option_id` bigint unsigned NOT NULL AUTO_INCREMENT,
          `option_name` varchar(191) NOT NULL DEFAULT '',
          `option_value` longtext NOT NULL,
          `autoload` varchar(20) NOT NULL DEFAULT 'yes',
          PRIMARY KEY (`option_id`),
          UNIQUE KEY `option_name` (`option_name`),
          KEY `autoload` (`autoload`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
    )
    .map_err(|e| format!("Failed to create wp_options: {}", e))?;

    conn.query_drop(
        "CREATE TABLE IF NOT EXISTS `wp_postmeta` (
          `meta_id` bigint unsigned NOT NULL AUTO_INCREMENT,
          `post_id` bigint unsigned NOT NULL DEFAULT 0,
          `meta_key` varchar(255) DEFAULT NULL,
          `meta_value` longtext,
          PRIMARY KEY (`meta_id`),
          KEY `post_id` (`post_id`),
          KEY `meta_key` (`meta_key`(191))
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
    )
    .map_err(|e| format!("Failed to create wp_postmeta: {}", e))?;

    conn.query_drop(
        "CREATE TABLE IF NOT EXISTS `wp_posts` (
          `ID` bigint unsigned NOT NULL AUTO_INCREMENT,
          `post_author` bigint unsigned NOT NULL DEFAULT 0,
          `post_date` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
          `post_date_gmt` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
          `post_content` longtext NOT NULL,
          `post_title` text NOT NULL,
          `post_excerpt` text NOT NULL,
          `post_status` varchar(20) NOT NULL DEFAULT 'publish',
          `comment_status` varchar(20) NOT NULL DEFAULT 'open',
          `ping_status` varchar(20) NOT NULL DEFAULT 'open',
          `post_password` varchar(255) NOT NULL DEFAULT '',
          `post_name` varchar(200) NOT NULL DEFAULT '',
          `to_ping` text NOT NULL,
          `pinged` text NOT NULL,
          `post_modified` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
          `post_modified_gmt` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
          `post_content_filtered` longtext NOT NULL,
          `post_parent` bigint unsigned NOT NULL DEFAULT 0,
          `guid` varchar(255) NOT NULL DEFAULT '',
          `menu_order` int NOT NULL DEFAULT 0,
          `post_type` varchar(20) NOT NULL DEFAULT 'post',
          `post_mime_type` varchar(100) NOT NULL DEFAULT '',
          `comment_count` bigint NOT NULL DEFAULT 0,
          PRIMARY KEY (`ID`),
          KEY `post_name` (`post_name`(191)),
          KEY `type_status_date` (`post_type`,`post_status`,`post_date`,`ID`),
          KEY `post_parent` (`post_parent`),
          KEY `post_author` (`post_author`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
    )
    .map_err(|e| format!("Failed to create wp_posts: {}", e))?;

    conn.query_drop(
        "CREATE TABLE IF NOT EXISTS `wp_users` (
          `ID` bigint unsigned NOT NULL AUTO_INCREMENT,
          `user_login` varchar(60) NOT NULL DEFAULT '',
          `user_pass` varchar(255) NOT NULL DEFAULT '',
          `user_nicename` varchar(50) NOT NULL DEFAULT '',
          `user_email` varchar(100) NOT NULL DEFAULT '',
          `user_url` varchar(100) NOT NULL DEFAULT '',
          `user_registered` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
          `user_activation_key` varchar(255) NOT NULL DEFAULT '',
          `user_status` int NOT NULL DEFAULT 0,
          `display_name` varchar(250) NOT NULL DEFAULT '',
          PRIMARY KEY (`ID`),
          KEY `user_login_key` (`user_login`),
          KEY `user_nicename` (`user_nicename`),
          KEY `user_email` (`user_email`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
    )
    .map_err(|e| format!("Failed to create wp_users: {}", e))?;

    conn.query_drop(
        "CREATE TABLE IF NOT EXISTS `wp_usermeta` (
          `umeta_id` bigint unsigned NOT NULL AUTO_INCREMENT,
          `user_id` bigint unsigned NOT NULL DEFAULT 0,
          `meta_key` varchar(255) DEFAULT NULL,
          `meta_value` longtext,
          PRIMARY KEY (`umeta_id`),
          KEY `user_id` (`user_id`),
          KEY `meta_key` (`meta_key`(191))
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
    )
    .map_err(|e| format!("Failed to create wp_usermeta: {}", e))?;

    // Seed wp_options — mirrors populate_options() in wp-admin/includes/schema.php
    let db_version = read_db_version(wp_version_dir);
    let admin_email_lifespan = (chrono::Utc::now().timestamp() + 6 * 2_629_800).to_string();

    // Standard options (autoload = 'yes'), as of WordPress v7
    let options: &[(&str, &str)] = &[
        ("siteurl",                        site_url),
        ("home",                           site_url),
        ("blogname",                       title),
        ("blogdescription",                ""),
        ("users_can_register",             "0"),
        ("admin_email",                    "admin@example.com"),
        ("start_of_week",                  "1"),
        ("use_balanceTags",                "0"),
        ("use_smilies",                    "1"),
        ("require_name_email",             "1"),
        ("comments_notify",                "1"),
        ("posts_per_rss",                  "10"),
        ("rss_use_excerpt",                "0"),
        ("mailserver_url",                 "mail.example.com"),
        ("mailserver_login",               "login@example.com"),
        ("mailserver_pass",                ""),
        ("mailserver_port",                "110"),
        ("default_category",               "1"),
        ("default_comment_status",         "open"),
        ("default_ping_status",            "open"),
        ("default_pingback_flag",          "1"),
        ("posts_per_page",                 "10"),
        ("date_format",                    "F j, Y"),
        ("time_format",                    "g:i a"),
        ("links_updated_date_format",      "F j, Y g:i a"),
        ("comment_moderation",             "0"),
        ("moderation_notify",              "1"),
        ("permalink_structure",            ""),
        ("rewrite_rules",                  ""),
        ("hack_file",                      "0"),
        ("blog_charset",                   "UTF-8"),
        ("category_base",                  ""),
        ("ping_sites",                     "https://rpc.pingomatic.com/"),
        ("comment_max_links",              "2"),
        ("gmt_offset",                     "0"),
        ("default_email_category",         "1"),
        ("comment_registration",           "0"),
        ("html_type",                      "text/html"),
        ("use_trackback",                  "0"),
        ("default_role",                   "subscriber"),
        ("db_version",                     &db_version),
        ("uploads_use_yearmonth_folders",  "1"),
        ("upload_path",                    ""),
        ("blog_public",                    "1"),
        ("default_link_category",          "2"),
        ("show_on_front",                  "posts"),
        ("tag_base",                       ""),
        ("show_avatars",                   "1"),
        ("avatar_rating",                  "G"),
        ("upload_url_path",                ""),
        ("thumbnail_size_w",               "150"),
        ("thumbnail_size_h",               "150"),
        ("thumbnail_crop",                 "1"),
        ("medium_size_w",                  "300"),
        ("medium_size_h",                  "300"),
        ("avatar_default",                 "mystery"),
        ("large_size_w",                   "1024"),
        ("large_size_h",                   "1024"),
        ("image_default_link_type",        "none"),
        ("image_default_size",             ""),
        ("image_default_align",            ""),
        ("close_comments_for_old_posts",   "0"),
        ("close_comments_days_old",        "14"),
        ("thread_comments",                "1"),
        ("thread_comments_depth",          "5"),
        ("page_comments",                  "0"),
        ("comments_per_page",              "50"),
        ("default_comments_page",          "newest"),
        ("comment_order",                  "asc"),
        ("sticky_posts",                   "a:0:{}"),
        ("widget_categories",              "a:0:{}"),
        ("widget_text",                    "a:0:{}"),
        ("widget_rss",                     "a:0:{}"),
        ("timezone_string",                ""),
        ("page_for_posts",                 "0"),
        ("page_on_front",                  "0"),
        ("default_post_format",            "0"),
        ("initial_db_version",             &db_version),
        ("link_manager_enabled",           "0"),
        ("finished_splitting_shared_terms","1"),
        ("site_icon",                      "0"),
        ("medium_large_size_w",            "768"),
        ("medium_large_size_h",            "0"),
        ("wp_page_for_privacy_policy",     "0"),
        ("show_comments_cookies_opt_in",   "1"),
        ("admin_email_lifespan",           &admin_email_lifespan),
        ("comment_previously_approved",    "1"),
        ("auto_update_core_dev",           "enabled"),
        ("auto_update_core_minor",         "enabled"),
        ("auto_update_core_major",         "enabled"),
        ("wp_force_deactivated_plugins",   "a:0:{}"),
        ("wp_attachment_pages_enabled",    "0"),
        ("wp_notes_notify",                "1"),
        ("wp_collaboration_enabled",       "0"),
        ("active_plugins",                 "a:0:{}"),
        ("template",                       "twentytwentyfive"),
        ("stylesheet",                     "twentytwentyfive"),
        ("wp_user_roles",                  WP_USER_ROLES),
    ];
    for (name, value) in options {
        conn.exec_drop(
            "INSERT IGNORE INTO `wp_options` (`option_name`, `option_value`, `autoload`) VALUES (?, ?, 'on')",
            (name, value),
        )
        .map_err(|e| format!("Failed to insert option {}: {}", name, e))?;
    }

    // Fat options — stored with autoload = 'off' to avoid bloating the autoload set
    let fat_options: &[(&str, &str)] = &[
        ("moderation_keys",               ""),
        ("recently_edited",               ""),
        ("disallowed_keys",               ""),
        ("uninstall_plugins",             "a:0:{}"),
        ("auto_plugin_theme_update_emails","a:0:{}"),
    ];
    for (name, value) in fat_options {
        conn.exec_drop(
            "INSERT IGNORE INTO `wp_options` (`option_name`, `option_value`, `autoload`) VALUES (?, ?, 'off')",
            (name, value),
        )
        .map_err(|e| format!("Failed to insert option {}: {}", name, e))?;
    }

    // Seed wp_users (admin)
    let registered = chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string();
    conn.exec_drop(
        "INSERT IGNORE INTO `wp_users` (`ID`, `user_login`, `user_pass`, `user_nicename`, `user_email`, `user_url`, `user_registered`, `user_activation_key`, `user_status`, `display_name`) VALUES (1, 'admin', '5f4dcc3b5aa765d61d8327deb882cf99', 'admin', 'admin@example.com', ?, ?, '', 0, 'Admin')",
        (site_url, &registered),
    )
    .map_err(|e| format!("Failed to insert admin user: {}", e))?;

    // Seed wp_usermeta
    conn.exec_drop(
        "INSERT IGNORE INTO `wp_usermeta` (`user_id`, `meta_key`, `meta_value`) VALUES (1, 'wp_capabilities', 'a:1:{s:13:\"administrator\";b:1;}')",
        (),
    )
    .map_err(|e| format!("Failed to insert wp_capabilities: {}", e))?;

    conn.exec_drop(
        "INSERT IGNORE INTO `wp_usermeta` (`user_id`, `meta_key`, `meta_value`) VALUES (1, 'wp_user_level', '10')",
        (),
    )
    .map_err(|e| format!("Failed to insert wp_user_level: {}", e))?;

    // Seed wp_terms (Uncategorized)
    conn.exec_drop(
        "INSERT IGNORE INTO `wp_terms` (`term_id`, `name`, `slug`, `term_group`) VALUES (1, 'Uncategorized', 'uncategorized', 0)",
        (),
    )
    .map_err(|e| format!("Failed to insert Uncategorized term: {}", e))?;

    // Seed wp_term_taxonomy
    conn.exec_drop(
        "INSERT IGNORE INTO `wp_term_taxonomy` (`term_taxonomy_id`, `term_id`, `taxonomy`, `description`, `parent`, `count`) VALUES (1, 1, 'category', '', 0, 1)",
        (),
    )
    .map_err(|e| format!("Failed to insert term taxonomy: {}", e))?;

    Ok(())
}