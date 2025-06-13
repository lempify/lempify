/**
 * SSL functions
 * @module ssl
 */

use std::fs;
use std::process::Command;

use crate::{dirs, nginx};

/**
 * Generate SSL certificates for a domain using mkcert
 * @param domain: The domain to generate certificates for
 * @returns: Result<(), String>
 * @example
 * ```
 * ssl::generate_certs("example.com");
 * ```
 */
pub fn generate_certs(domain: &str) -> Result<(), String> {
    // println!("\tgenerate_certs: {}", domain);
    let certs_dir = dirs::get_certs()?;

    let cert_path = certs_dir.join(format!("{domain}.pem"));
    let key_path = certs_dir.join(format!("{domain}-key.pem"));

    if !(cert_path.exists() && key_path.exists()) {
        let status = Command::new("mkcert")
            .current_dir(&certs_dir)
            .arg(domain)
            .stdout(std::process::Stdio::null())
            .stderr(std::process::Stdio::null())
            .status()
            .map_err(|e| format!("Failed to generate certs for {}: {}", domain, e))?;

        if !status.success() {
            return Err(format!("Failed to generate certs for {}: {}", domain, status));
        }
    }
    // println!("\tgenerate_certs: Done!");

    Ok(())
}

/**
 * Secure a site with SSL by generating certs and updating nginx config
 * @param domain: The domain to secure
 * @returns: Result<(), String>
 * @example
 * ```
 * ssl::secure_site("example.com");
 * ```
 */
pub fn secure_site(domain: &str) -> Result<(), String> {
    // println!("\tsecure_site: {}", domain);
    generate_certs(domain)?;
    // println!("\t\tgenerate_certs: Done!");
    nginx::update_nginx_config_with_ssl(domain)?;
    // println!("\t\tupdate_nginx_config_with_ssl: Done!");
    nginx::restart_nginx()?;
    // println!("\t\trestart_nginx: Done!");
    Ok(())
}

/**
 * Delete certs for a domain
 * @param domain: The domain to delete certs for
 * @returns: Result<(), String>
 * @example
 * ```
 * ssl::delete_certs("example.com");
 * ```
 */
pub fn delete_certs(domain: &str) -> Result<(), String> {
    let certs_dir = dirs::get_certs()?;
    let cert_path = certs_dir.join(format!("{domain}.pem"));
    let key_path = certs_dir.join(format!("{domain}-key.pem"));
    if cert_path.exists() {
        fs::remove_file(&cert_path)
            .map_err(|e| format!("Failed to delete cert: {}", e))?;
    }
    if key_path.exists() {
        fs::remove_file(&key_path)
            .map_err(|e| format!("Failed to delete key: {}", e))?;
    }
    Ok(())
}

/**
 * Check if a domain has SSL certificates
 * @param domain: The domain to check
 * @returns: Result<bool, String>
 * @example
 * ```
 * ssl::has_ssl("example.com");
 * ```
 */
pub fn has_ssl(domain: &str) -> Result<bool, String> {
    let certs_dir = dirs::get_certs()?;
    let cert_path = certs_dir.join(format!("{domain}.pem"));
    let key_path = certs_dir.join(format!("{domain}-key.pem"));
    Ok(cert_path.exists() && key_path.exists())
}