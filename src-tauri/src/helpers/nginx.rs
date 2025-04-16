use std::{fs, path::Path};

use crate::helpers::paths::get_nginx_dir;

pub fn ensure_lempify_include_in_nginx_conf() -> Result<(), String> {
    let nginx_conf_path = "/opt/homebrew/etc/nginx/nginx.conf";
    let nginx_dir = get_nginx_dir()?;
    let include_path = nginx_dir.join("*.conf");
    let include_block = format!("# Lempify\n\tinclude {};", include_path.display());

    let contents = fs::read_to_string(nginx_conf_path)
        .map_err(|e| format!("Failed to read nginx.conf: {}", e))?;

    if contents.contains(&include_block) {
        println!("🛠 Nginx already patched");
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

    fs::write(nginx_conf_path, patched)
        .map_err(|e| format!("Failed to write patched nginx.conf: {}", e))?;

    println!("🛠 Patched nginx.conf to include Lempify config path.");

    Ok(())
}

pub fn generate_nginx_config_template(name: &str, tld: &str, root_path: &Path) -> String {
    format!(
        r#"
server {{
    listen 80;
    server_name {name}.{tld};

    root {root};
    index index.php index.html;

    location / {{
        try_files $uri $uri/ /index.php?$args;
    }}

    location ~ \.php$ {{
        include fastcgi_params;
        fastcgi_pass unix:/opt/homebrew/var/run/php/php-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    }}
}}
"#,
        name = name,
        tld = tld,
        root = root_path.display()
    )
}
