use std::{fs, path::Path};

use crate::{file_system::AppFileSystem, utils_legacy::FileSudoCommand};

/// Add Lempify include to the main Nginx config
pub fn add_lempify_to_conf() -> Result<(), String> {
    let nginx_conf_path = "/opt/homebrew/etc/nginx/nginx.conf";
    let sites_enabled_dir = AppFileSystem::new()?.nginx_sites_enabled_dir;
    let include_path = sites_enabled_dir.join("*.conf");
    let include_block = format!("# Lempify\n\tinclude {};", include_path.display());

    let contents = fs::read_to_string(nginx_conf_path)
        .map_err(|e| format!("Failed to read nginx.conf: {}", e))?;

    if contents.contains(&include_block) {
        return Ok(()); // already patched
    }

    // Backup the original file
    fs::copy(nginx_conf_path, format!("{}.bak", nginx_conf_path))
        .map_err(|e| format!("Failed to backup nginx.conf: {}", e))?;

    // Patch it in
    let mut in_http_block = false;
    let mut bracket_depth = 0;
    let mut patched_lines = vec![];

    for line in contents.lines() {
        let trimmed = line.trim();

        // Detect the start of the http block
        if trimmed.starts_with("http") && trimmed.ends_with("{") && !in_http_block {
            in_http_block = true;
            bracket_depth = 1;
            patched_lines.push(line.to_string());
            continue;
        }

        if in_http_block {
            // Count open and close braces
            bracket_depth += trimmed.matches('{').count();
            bracket_depth -= trimmed.matches('}').count();

            // Before closing the http block (when it hits depth 0), inject the include
            if bracket_depth == 0 {
                patched_lines.push(format!("    {}", include_block));
                in_http_block = false;
            }
        }

        patched_lines.push(line.to_string());
    }

    let patched = patched_lines.join("\n");

    write_file_with_sudo(&patched, Path::new(nginx_conf_path))?;

    // Remove the backup file
    if let Err(e) = fs::remove_file(format!("{}.bak", nginx_conf_path)) {
        println!("Failed to remove nginx.conf backup: {}", e);
    }

    Ok(())
}

/// Update a site's Nginx config with SSL configuration
pub fn update_nginx_config_with_ssl(domain: &str) -> Result<(), String> {
    let sites_enabled_dir = AppFileSystem::new()?.nginx_sites_enabled_dir;
    let certs_dir = AppFileSystem::new()?.certs_dir;
    let nginx_config_path = sites_enabled_dir.join(format!("{}.conf", domain));

    let contents = fs::read_to_string(&nginx_config_path)
        .map_err(|e| format!("Failed to read nginx config: {}", e))?;

    // Bail if ssl config exists
    if contents.contains("listen 443 ssl") {
        return Ok(());
    }

    let mut patched_lines = vec![];

    for line in contents.lines() {
        let trimmed = line.trim();

        if trimmed.starts_with("## Lempify SSL ##") {
            let domain_cert_path = certs_dir.join(format!("{}.pem", domain));
            let domain_key_path = certs_dir.join(format!("{}-key.pem", domain));

            patched_lines.push(format!("\t## Lempify SSL ##\n\tlisten 443 ssl;\n\tssl_certificate {};\n\tssl_certificate_key {};\n\tssl_protocols TLSv1.2 TLSv1.3;\n\tssl_ciphers HIGH:!aNULL:!MD5;", domain_cert_path.display(), domain_key_path.display()));
        } else {
            patched_lines.push(line.to_string());
        }
    }

    let patched = patched_lines.join("\n");

    write_file_with_sudo(&patched, &nginx_config_path)?;

    Ok(())
}

/// Write a file to a system location that requires elevated permissions
fn write_file_with_sudo(content: &str, target_path: &Path) -> Result<(), String> {
    FileSudoCommand::write(content.to_string(), target_path.to_path_buf()).run()
}
