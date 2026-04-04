use std::process::{Command, Stdio};

use shared::brew;
use shared::constants::DEFAULT_PHP_VERSION;
use shared::file_system::AppFileSystem;

use crate::models::Service as BaseService;
use crate::services::config::ServiceConfig;
use crate::services::error::ServiceError;
use crate::services::isolation::ServiceIsolation;

pub struct Service {
    version: String,
    full_name: String,
    display_name: String,
    isolation: ServiceIsolation,
    config: ServiceConfig,
    #[allow(dead_code)]
    supported_versions: Vec<&'static str>,
}

impl Service {
    pub fn new(version: &str) -> Result<Self, ServiceError> {
        let file_system =
            AppFileSystem::new().map_err(|e| ServiceError::FileSystemError(e.to_string()))?;
        let isolation = ServiceIsolation::new("php")?;
        let config = ServiceConfig::new(file_system, "php".to_string(), version.to_string())?;

        let service = Self {
            version: version.to_string(),
            full_name: format!("php@{}", version),
            display_name: format!("PHP {}", version),
            isolation,
            config,
            supported_versions: vec!["8.4", "8.3", "8.2", "8.1", "8.0"],
        };

        // Ensure configuration is set up when service is created
        service.setup_config()?;

        Ok(service)
    }

    fn fpm_config_filename(&self) -> String {
        format!("php-{}-fpm.conf", self.version)
    }

    fn generate_fpm_config(&self) -> String {
        let socket_path = self
            .isolation
            .get_service_socket_dir_no_spaces()
            .join(format!("php-{}.sock", self.version));
        let log_path = self.isolation.get_service_log_dir().join("php-fpm.log");
        let pid_path = format!("/opt/homebrew/var/run/php-fpm-{}.pid", self.version);

        format!(
            r#"[global]
pid = {}
error_log = {}
daemonize = yes

[www]
listen = {}
listen.mode = 0666
pm = dynamic
pm.max_children = 5
pm.start_servers = 2
pm.min_spare_servers = 1
pm.max_spare_servers = 3
php_admin_value[upload_max_filesize] = 64M
php_admin_value[post_max_size] = 64M
php_admin_value[memory_limit] = 256M
php_admin_value[max_execution_time] = 120
"#,
            pid_path,
            log_path.display(),
            socket_path.display(),
        )
    }

    fn setup_config(&self) -> Result<(), ServiceError> {
        // Ensure all required paths exist
        self.isolation.ensure_paths()?;

        // Generate and write version-isolated FPM config
        let config_content = self.generate_fpm_config();
        let config_path = self
            .isolation
            .get_service_config_dir()
            .join(self.fpm_config_filename());

        self.config.write_file(&config_path, &config_content)?;

        // Patch any existing xdebug ini that still uses trigger mode
        self.patch_xdebug_start_mode();

        Ok(())
    }

    // Rewrites `start_with_request=trigger` → `start_with_request=yes` in the
    // Homebrew conf.d xdebug ini if it exists. Safe to call repeatedly.
    fn patch_xdebug_start_mode(&self) {
        let xdebug_ini = std::path::PathBuf::from(format!(
            "/opt/homebrew/etc/php/{}/conf.d/ext-xdebug.ini",
            self.version
        ));
        if let Ok(contents) = std::fs::read_to_string(&xdebug_ini) {
            if contents.contains("start_with_request=trigger") {
                let patched = contents.replace("start_with_request=trigger", "start_with_request=yes");
                let _ = std::fs::write(&xdebug_ini, patched);
            }
        }
    }

    // Returns the version reported by the unversioned Homebrew PHP binary, if it exists.
    // Uses `-n` so no ini files are loaded and stdout is clean.
    fn default_php_version() -> Option<String> {
        let output = std::process::Command::new("/opt/homebrew/opt/php/bin/php")
            .args(["-n", "-r", "echo PHP_MAJOR_VERSION . '.' . PHP_MINOR_VERSION;"])
            .stdin(std::process::Stdio::null())
            .stdout(std::process::Stdio::piped())
            .stderr(std::process::Stdio::null())
            .output()
            .ok()?;
        let v = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if v.contains('.') { Some(v) } else { None }
    }

    fn php_fpm_binary(&self) -> Result<String, ServiceError> {
        let opt_versioned = format!("/opt/homebrew/opt/php@{}/sbin/php-fpm", self.version);
        if std::path::Path::new(&opt_versioned).exists() {
            return Ok(opt_versioned);
        }
        // Only use the unversioned path if it actually belongs to this version
        let opt_plain = "/opt/homebrew/opt/php/sbin/php-fpm";
        if std::path::Path::new(opt_plain).exists()
            && Self::default_php_version().as_deref() == Some(self.version.as_str())
        {
            return Ok(opt_plain.to_string());
        }
        Err(ServiceError::ServiceError(format!(
            "Could not find php-fpm binary for PHP {}",
            self.version
        )))
    }

    fn pecl_binary(&self) -> Result<String, ServiceError> {
        let opt_versioned = format!("/opt/homebrew/opt/php@{}/bin/pecl", self.version);
        if std::path::Path::new(&opt_versioned).exists() {
            return Ok(opt_versioned);
        }
        let opt_plain = "/opt/homebrew/opt/php/bin/pecl";
        if std::path::Path::new(opt_plain).exists()
            && Self::default_php_version().as_deref() == Some(self.version.as_str())
        {
            return Ok(opt_plain.to_string());
        }
        Err(ServiceError::ServiceError(format!(
            "Could not find pecl binary for PHP {}",
            self.version
        )))
    }

    fn php_binary(&self) -> Result<String, ServiceError> {
        let opt_versioned = format!("/opt/homebrew/opt/php@{}/bin/php", self.version);
        if std::path::Path::new(&opt_versioned).exists() {
            return Ok(opt_versioned);
        }
        let opt_plain = "/opt/homebrew/opt/php/bin/php";
        if std::path::Path::new(opt_plain).exists()
            && Self::default_php_version().as_deref() == Some(self.version.as_str())
        {
            return Ok(opt_plain.to_string());
        }
        Err(ServiceError::ServiceError(format!(
            "Could not find php binary for PHP {}",
            self.version
        )))
    }

    // Returns the directory PHP scans for additional .ini files.
    // Uses `-n` so no ini is loaded — stdout contains only the constant, no warnings.
    fn php_conf_d_dir(&self) -> Result<std::path::PathBuf, ServiceError> {
        let php_bin = self.php_binary()?;
        let output = Command::new(&php_bin)
            .args(["-n", "-r", "echo PHP_CONFIG_FILE_SCAN_DIR;"])
            .stdin(Stdio::null())
            .stdout(Stdio::piped())
            .stderr(Stdio::null())
            .output()
            .map_err(|e| ServiceError::ServiceError(format!("Failed to run php binary: {}", e)))?;
        let dir = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if dir.is_empty() {
            return Err(ServiceError::ServiceError(format!(
                "PHP {} returned empty PHP_CONFIG_FILE_SCAN_DIR",
                self.version
            )));
        }
        Ok(std::path::PathBuf::from(dir))
    }

    // Returns the path to the php.ini for this PHP version, derived from the conf.d parent.
    // Avoids running php with ini loaded (which would pollute stdout with extension warnings).
    fn php_ini_path(&self) -> Result<std::path::PathBuf, ServiceError> {
        let conf_d = self.php_conf_d_dir()?;
        let ini = conf_d
            .parent()
            .ok_or_else(|| ServiceError::ServiceError(format!(
                "Could not determine php.ini path for PHP {}",
                self.version
            )))?
            .join("php.ini");
        if !ini.exists() {
            return Err(ServiceError::ServiceError(format!(
                "php.ini not found at {} for PHP {}",
                ini.display(),
                self.version
            )));
        }
        Ok(ini)
    }

    // Returns the directory where pecl installs extensions for this PHP version.
    //
    // Homebrew places pecl extensions at `/opt/homebrew/lib/php/pecl/{PHP_EXTENSION_API}/`,
    // which differs from `PHP_EXTENSION_DIR` (the Cellar path) and is more reliably
    // obtained from `PHP_EXTENSION_API` than from `pecl config-get ext_dir` (which
    // requires PEAR to be initialised and may return empty).
    fn pecl_ext_dir(&self) -> Result<String, ServiceError> {
        let php_bin = self.php_binary()?;
        let output = Command::new(&php_bin)
            .args(["-n", "-r", "echo basename(PHP_EXTENSION_DIR);"])
            .stdin(Stdio::null())
            .stdout(Stdio::piped())
            .stderr(Stdio::null())
            .output()
            .map_err(|e| ServiceError::ServiceError(format!("Failed to run php binary: {}", e)))?;
        let api = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if api.is_empty() {
            return Err(ServiceError::ServiceError(format!(
                "PHP {} returned empty basename(PHP_EXTENSION_DIR)",
                self.version
            )));
        }
        let dir = format!("/opt/homebrew/lib/php/pecl/{}", api);
        if !std::path::Path::new(&dir).exists() {
            return Err(ServiceError::ServiceError(format!(
                "pecl ext_dir does not exist at expected path: {}",
                dir
            )));
        }
        Ok(dir)
    }

    // Builds and installs the memcached PHP extension from source using phpize.
    //
    // PECL's `install --configureoptions` fails on PHP 8.5 due to a PEAR/Builder.php
    // type incompatibility. Building directly with phpize → configure → make bypasses
    // PEAR entirely and works consistently across all PHP versions.
    fn install_memcached_from_source(&self, ext_dir: &str) -> Result<(), ServiceError> {
        let phpize = {
            let opt_versioned = format!("/opt/homebrew/opt/php@{}/bin/phpize", self.version);
            if std::path::Path::new(&opt_versioned).exists() {
                opt_versioned
            } else {
                "/opt/homebrew/opt/php/bin/phpize".to_string()
            }
        };
        let php_config = {
            let opt_versioned = format!("/opt/homebrew/opt/php@{}/bin/php-config", self.version);
            if std::path::Path::new(&opt_versioned).exists() {
                opt_versioned
            } else {
                "/opt/homebrew/opt/php/bin/php-config".to_string()
            }
        };

        // Ensure required Homebrew libraries are present before building.
        for pkg in &["zlib", "libmemcached"] {
            if !std::path::Path::new(&format!("/opt/homebrew/opt/{}", pkg)).exists() {
                let output = Command::new("brew")
                    .args(["install", "--quiet", pkg])
                    .stdin(Stdio::null())
                    .stdout(Stdio::piped())
                    .stderr(Stdio::piped())
                    .output()
                    .map_err(|e| ServiceError::ServiceError(format!("brew install {} failed: {}", pkg, e)))?;
                if !output.status.success() {
                    return Err(ServiceError::ServiceError(format!(
                        "Failed to install {}: {}",
                        pkg,
                        String::from_utf8_lossy(&output.stderr).trim()
                    )));
                }
            }
        }

        let src_version = "3.4.0";
        let tarball_name = format!("memcached-{}.tgz", src_version);
        // Use a PHP-version-specific build dir to avoid cross-contamination between
        // builds (a stale dir from another PHP version would produce a .so compiled
        // for the wrong API and make would skip recompilation silently).
        let tarball_path = std::path::PathBuf::from(format!("/tmp/{}", tarball_name));
        let src_dir = std::path::PathBuf::from(format!("/tmp/memcached-{}-php{}", src_version, self.version));

        if !tarball_path.exists() {
            let url = format!("https://pecl.php.net/get/{}", tarball_name);
            let output = Command::new("curl")
                .args(["-fsSL", "-o", tarball_path.to_str().unwrap(), &url])
                .stdin(Stdio::null())
                .stdout(Stdio::piped())
                .stderr(Stdio::piped())
                .output()
                .map_err(|e| ServiceError::ServiceError(format!("curl failed: {}", e)))?;
            if !output.status.success() {
                return Err(ServiceError::ServiceError(format!(
                    "Failed to download memcached source: {}",
                    String::from_utf8_lossy(&output.stderr).trim()
                )));
            }
        }

        if src_dir.exists() {
            std::fs::remove_dir_all(&src_dir)
                .map_err(|e| ServiceError::ServiceError(format!("Failed to clean build dir: {}", e)))?;
        }
        // tar extracts as memcached-{version}/; rename to the version-specific dir after.
        let extracted_dir = std::path::PathBuf::from(format!("/tmp/memcached-{}", src_version));
        if extracted_dir.exists() {
            std::fs::remove_dir_all(&extracted_dir)
                .map_err(|e| ServiceError::ServiceError(format!("Failed to remove stale extract dir: {}", e)))?;
        }
        let output = Command::new("tar")
            .args(["-xzf", tarball_path.to_str().unwrap(), "-C", "/tmp"])
            .stdin(Stdio::null())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .output()
            .map_err(|e| ServiceError::ServiceError(format!("tar failed: {}", e)))?;
        if !output.status.success() {
            return Err(ServiceError::ServiceError(format!(
                "Failed to extract memcached source: {}",
                String::from_utf8_lossy(&output.stderr).trim()
            )));
        }
        std::fs::rename(&extracted_dir, &src_dir)
            .map_err(|e| ServiceError::ServiceError(format!("Failed to rename build dir: {}", e)))?;

        let output = Command::new(&phpize)
            .current_dir(&src_dir)
            .stdin(Stdio::null())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .output()
            .map_err(|e| ServiceError::ServiceError(format!("phpize failed: {}", e)))?;
        if !output.status.success() {
            return Err(ServiceError::ServiceError(format!(
                "phpize failed: {}",
                String::from_utf8_lossy(&output.stderr).trim()
            )));
        }

        let output = Command::new("./configure")
            .current_dir(&src_dir)
            .args([
                &format!("--with-php-config={}", php_config),
                "--with-zlib-dir=/opt/homebrew/opt/zlib",
                "--with-libmemcached-dir=/opt/homebrew/opt/libmemcached",
            ])
            .stdin(Stdio::null())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .output()
            .map_err(|e| ServiceError::ServiceError(format!("configure failed: {}", e)))?;
        if !output.status.success() {
            return Err(ServiceError::ServiceError(format!(
                "memcached configure failed: {}",
                String::from_utf8_lossy(&output.stderr).trim()
            )));
        }

        let ncpu = std::thread::available_parallelism()
            .map(|n| n.get().to_string())
            .unwrap_or_else(|_| "2".to_string());
        let output = Command::new("make")
            .current_dir(&src_dir)
            .arg(format!("-j{}", ncpu))
            .stdin(Stdio::null())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .output()
            .map_err(|e| ServiceError::ServiceError(format!("make failed: {}", e)))?;
        if !output.status.success() {
            return Err(ServiceError::ServiceError(format!(
                "memcached make failed: {}",
                String::from_utf8_lossy(&output.stderr).trim()
            )));
        }

        let output = Command::new("make")
            .current_dir(&src_dir)
            .arg("install")
            .stdin(Stdio::null())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .output()
            .map_err(|e| ServiceError::ServiceError(format!("make install failed: {}", e)))?;
        if !output.status.success() {
            return Err(ServiceError::ServiceError(format!(
                "memcached make install failed: {}",
                String::from_utf8_lossy(&output.stderr).trim()
            )));
        }

        // make install targets the Cellar path; Homebrew symlinks it to ext_dir.
        // If the symlink isn't set up yet, copy the .so directly.
        let so_path = std::path::PathBuf::from(format!("{}/memcached.so", ext_dir));
        if !so_path.exists() {
            let api = std::path::Path::new(ext_dir)
                .file_name()
                .map(|n| n.to_string_lossy().to_string())
                .unwrap_or_default();
            // Walk Cellar to find any installed PHP version dir
            let cellar_base = std::path::Path::new("/opt/homebrew/Cellar/php");
            if let Ok(entries) = std::fs::read_dir(cellar_base) {
                for entry in entries.flatten() {
                    let candidate = entry.path().join("pecl").join(&api).join("memcached.so");
                    if candidate.exists() {
                        std::fs::copy(&candidate, &so_path)
                            .map_err(|e| ServiceError::ServiceError(format!("Failed to copy memcached.so: {}", e)))?;
                        break;
                    }
                }
            }
        }

        let _ = std::fs::remove_dir_all(&src_dir);

        if !so_path.exists() {
            return Err(ServiceError::ServiceError(format!(
                "memcached.so not found at {} after build",
                so_path.display()
            )));
        }

        Ok(())
    }

}

impl BaseService for Service {
    fn name(&self) -> &str {
        &self.full_name
    }

    fn human_name(&self) -> &str {
        &self.display_name
    }

    fn url(&self) -> &str {
        #[cfg(target_os = "macos")]
        {
            "https://formulae.brew.sh/formula/php"
        }
        #[cfg(target_os = "linux")]
        {
            "https://www.php.net/"
        }
    }

    fn is_required(&self) -> bool {
        true
    }

    fn get_type(&self) -> &str {
        "service"
    }

    fn version(&self) -> &str {
        &self.version
    }

    fn isolation(&self) -> Option<&ServiceIsolation> {
        Some(&self.isolation)
    }

    fn is_installed(&self) -> bool {
        // Check for the versioned opt path first (works for any tap source)
        let versioned = format!("/opt/homebrew/opt/php@{}/sbin/php-fpm", self.version);
        if std::path::Path::new(&versioned).exists() {
            return true;
        }
        // Only treat the unversioned path as this version if the binary reports the same version
        std::path::Path::new("/opt/homebrew/opt/php/sbin/php-fpm").exists()
            && Self::default_php_version().as_deref() == Some(self.version.as_str())
    }

    fn is_running(&self) -> bool {
        let socket_path = self
            .isolation
            .get_service_socket_dir_no_spaces()
            .join(format!("php-{}.sock", self.version));

        if !socket_path.exists() {
            return false;
        }

        match std::os::unix::net::UnixStream::connect(&socket_path) {
            Ok(_) => true,
            Err(_) => false,
        }
    }

    fn install(&self) -> Result<bool, ServiceError> {
        if self.is_installed() {
            // Ensure PECL extensions are present even for pre-installed versions
            self.post_install()?;
            // Restart so PHP-FPM loads any newly written ini files
            self.restart()?;
            return Ok(true);
        }

        self.isolation
            .brew_command(&["install", &format!("php@{}", self.version)])
            .run()
            .map_err(|e| ServiceError::BrewError(e.to_string()))?;

        println!("PHP isolation");

        // Set up initial configuration after install
        self.setup_config()?;

        println!("PHP Config setup complete.");

        self.post_install()?;

        println!("PHP post install complete.");
        // Can be replaced with start()?;
        self.restart()?;

        println!("PHP restart complete.");

        Ok(true)
    }

    fn start(&self) -> Result<bool, ServiceError> {
        if !self.is_installed() {
            return Err(ServiceError::NotInstalled(format!("PHP {}", self.version)));
        }

        if self.is_running() {
            return Ok(true);
        }

        // Ensure configuration is up to date before starting
        self.setup_config()?;

        // Ensure the socket directory exists
        let socket_path = self
            .isolation
            .get_service_socket_dir_no_spaces()
            .join(format!("php-{}.sock", self.version));
        if let Some(socket_dir) = socket_path.parent() {
            self.config
                .file_system
                .create_dir_all(socket_dir)
                .map_err(|e| {
                    ServiceError::ServiceError(format!("Failed to create socket directory: {}", e))
                })?;
        }

        // Remove any existing socket file
        if socket_path.exists() {
            let _ = std::fs::remove_file(&socket_path);
        }

        // Start PHP-FPM using our version-isolated config
        let config_path = self
            .isolation
            .get_service_config_dir()
            .join(self.fpm_config_filename());

        // Find the php-fpm binary
        let php_fpm_binary = self.php_fpm_binary().unwrap();

        // Start PHP-FPM with our isolated config
        std::process::Command::new(&php_fpm_binary)
            .arg("--fpm-config")
            .arg(&config_path)
            .spawn()
            .map_err(|e| ServiceError::ServiceError(format!("Failed to start PHP-FPM: {}", e)))?;

        // Give the process a moment to start
        std::thread::sleep(std::time::Duration::from_millis(1000));

        // Verify the service is running
        if self.is_running() {
            Ok(true)
        } else {
            Err(ServiceError::ServiceError(
                "PHP-FPM failed to start".to_string(),
            ))
        }
    }

    fn stop(&self) -> Result<bool, ServiceError> {
        if !self.is_running() {
            println!("PHP is NOT running. Skipping stop().");
            return Ok(true);
        }

        // Kill the process using our PID file
        let pid_file = format!("/opt/homebrew/var/run/php-fpm-{}.pid", self.version);

        if let Ok(pid_content) = std::fs::read_to_string(&pid_file) {
            if let Ok(pid) = pid_content.trim().parse::<u32>() {
                let _ = std::process::Command::new("kill")
                    .arg("-TERM")
                    .arg(pid.to_string())
                    .status();
            }
        }

        // Remove the socket file
        let socket_path = self
            .isolation
            .get_service_socket_dir_no_spaces()
            .join(format!("php-{}.sock", self.version));
        if socket_path.exists() {
            let _ = std::fs::remove_file(&socket_path);
        }

        Ok(true)
    }

    fn restart(&self) -> Result<bool, ServiceError> {
        if !self.is_installed() {
            return Err(ServiceError::NotInstalled(format!("PHP {}", self.version)));
        }

        // Ensure configuration is up to date before restarting
        self.setup_config()?;

        // Stop first
        self.stop()?;

        // Start with new config
        self.start()
    }

    fn post_install(&self) -> Result<(), ServiceError> {
        let conf_d = self.php_conf_d_dir()?;
        let ext_dir = self.pecl_ext_dir()?;

        let xdebug_so   = std::path::PathBuf::from(format!("{}/xdebug.so", ext_dir));
        let redis_so     = std::path::PathBuf::from(format!("{}/redis.so", ext_dir));
        let memcached_so = std::path::PathBuf::from(format!("{}/memcached.so", ext_dir));
        let xdebug_ini   = conf_d.join("ext-xdebug.ini");
        let redis_ini    = conf_d.join("ext-redis.ini");
        let memcached_ini = conf_d.join("ext-memcached.ini");

        // --- Step 1: Fix/clean ini files immediately ---
        // This clears any previously broken state (e.g. extension_dir override) so that
        // FPM can restart cleanly regardless of what happens during extension install below.
        if xdebug_so.exists() {
            self.config.write_file(
                &xdebug_ini,
                &format!(
                    "zend_extension=\"{}/xdebug.so\"\nxdebug.mode=debug\nxdebug.start_with_request=yes\n",
                    ext_dir
                ),
            )?;
        } else {
            let _ = std::fs::remove_file(&xdebug_ini);
        }

        if redis_so.exists() {
            self.config.write_file(
                &redis_ini,
                &format!("extension=\"{}/redis.so\"\n", ext_dir),
            )?;
        } else {
            let _ = std::fs::remove_file(&redis_ini);
        }

        if memcached_so.exists() {
            self.config.write_file(
                &memcached_ini,
                &format!("extension=\"{}/memcached.so\"\n", ext_dir),
            )?;
        } else {
            let _ = std::fs::remove_file(&memcached_ini);
        }

        // Strip any pecl-appended bare extension lines from php.ini to avoid duplicates
        if let Ok(php_ini_path) = self.php_ini_path() {
            if let Ok(contents) = std::fs::read_to_string(&php_ini_path) {
                let filtered = contents
                    .lines()
                    .filter(|line| {
                        !line.contains("xdebug.so")
                            && !line.contains("redis.so")
                            && !line.contains("memcached.so")
                    })
                    .collect::<Vec<_>>()
                    .join("\n");
                let _ = std::fs::write(&php_ini_path, filtered);
            }
        }

        // --- Step 2: Install missing extensions (check by .so presence, not pecl list) ---
        let pecl = self.pecl_binary()?;

        if !xdebug_so.exists() {
            println!("Installing xdebug with pecl.");
            let output = Command::new(&pecl)
                .arg("install")
                .arg("xdebug")
                .stdin(Stdio::null())
                .stdout(Stdio::piped())
                .stderr(Stdio::piped())
                .output()
                .map_err(|e| ServiceError::ServiceError(format!("Failed to run pecl install xdebug: {}", e)))?;
            if !output.status.success() {
                return Err(ServiceError::ServiceError(format!(
                    "Failed to install xdebug: stdout={} stderr={}",
                    String::from_utf8_lossy(&output.stdout).trim(),
                    String::from_utf8_lossy(&output.stderr).trim(),
                )));
            }
            self.config.write_file(
                &xdebug_ini,
                &format!(
                    "zend_extension=\"{}/xdebug.so\"\nxdebug.mode=debug\nxdebug.start_with_request=yes\n",
                    ext_dir
                ),
            )?;
        }

        if !redis_so.exists() {
            println!("Installing redis extension with pecl.");
            let output = Command::new(&pecl)
                .arg("install")
                .arg("redis")
                .stdin(Stdio::null())
                .stdout(Stdio::piped())
                .stderr(Stdio::piped())
                .output()
                .map_err(|e| ServiceError::ServiceError(format!("Failed to run pecl install redis: {}", e)))?;
            if !output.status.success() {
                return Err(ServiceError::ServiceError(format!(
                    "Failed to install redis extension: stdout={} stderr={}",
                    String::from_utf8_lossy(&output.stdout).trim(),
                    String::from_utf8_lossy(&output.stderr).trim(),
                )));
            }
            self.config.write_file(
                &redis_ini,
                &format!("extension=\"{}/redis.so\"\n", ext_dir),
            )?;
        }

        if !memcached_so.exists() {
            println!("Installing memcached extension from source (phpize).");
            self.install_memcached_from_source(&ext_dir)?;
            self.config.write_file(
                &memcached_ini,
                &format!("extension=\"{}/memcached.so\"\n", ext_dir),
            )?;
        }

        Ok(())
    }

    fn uninstall(&self) -> Result<bool, ServiceError> {
        if !self.is_installed() {
            return Ok(true);
        }
        // Stop FPM (kills process via PID + removes socket) before uninstalling
        let _ = self.stop();
        self.isolation
            .brew_command(&["uninstall", &format!("php@{}", self.version)])
            .run()
            .map_err(|e| ServiceError::BrewError(e.to_string()))?;
        Ok(true)
    }
}
