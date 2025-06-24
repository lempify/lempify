# PHP:

# Service Management Refactoring Plan

## Current Issues
1. Duplicate service management code across multiple files
2. Inconsistent socket path handling
3. Scattered configuration management
4. Multiple implementations of service status checking
5. Core utilities like AppFileSystem not in shared module

## Important
- Changes must be separate from current code to eliminate risk i.e. new directories and/or modules
- Must be able to handle multiple services i.e. NGINX, MySQL, Redis (Future)
- Services must be owned by Lempify and remain unaffected by other software
- Keep the API unified/centralized while allowing flexibility for service-specific quirks
- Reuse existing functionality where appropriate
- Keep service management within lempifyd for future daemon functionality
- Move core utilities to shared module

## Proposed Refactoring

### 1. Move AppFileSystem to Shared
```rust
// src-tauri/shared/src/file_system.rs
pub struct AppFileSystem {
    /** `/lempify/src-tauri/` */
    pub app_dir: PathBuf,
    /** `/opt/homebrew/var/www/` or `/var/www` */
    pub sites_dir: PathBuf,
    /** `/opt/homebrew/etc/nginx` or `/etc/nginx` */
    pub nginx_dir: PathBuf,
    /** `/opt/homebrew/etc/nginx/ssl` or `/etc/nginx/ssl` */
    pub certs_dir: PathBuf,
    /** `/lempify/src-tauri/stubs` */
    pub app_stubs_dir: PathBuf,
    /** `~/Library/Application Support/Lempify/` */
    pub config_dir: PathBuf,
    /** `~/Library/Application Support/Lempify/site-types` */
    pub site_types_dir: PathBuf,
}

impl AppFileSystem {
    pub fn new() -> Result<Self, String> {
        // Existing implementation...
    }

    pub fn is_dir(&self, path: &Path) -> bool {
        path.is_dir()
    }

    pub fn is_file(&self, path: &Path) -> bool {
        path.is_file()
    }
    
    pub fn mkdir(&self, path: &Path, owner: &User, mode: u32) -> Result<(), String> {
        // Existing implementation...
    }
}
```

### 2. Create Service Isolation Module
```rust
// src-tauri/lempifyd/services/isolation.rs
use shared::file_system::AppFileSystem;
use shared::brew::BrewCommand;

pub struct ServiceIsolation {
    file_system: AppFileSystem,
    service_name: String,
}

impl ServiceIsolation {
    pub fn new(service_name: &str) -> Result<Self, ServiceError> {
        Ok(Self {
            file_system: AppFileSystem::new()?,
            service_name: service_name.to_string(),
        })
    }

    pub fn get_socket_path(&self) -> PathBuf {
        self.file_system.config_dir
            .join("services")
            .join(&self.service_name)
            .join("socket")
    }

    pub fn get_config_path(&self) -> PathBuf {
        self.file_system.config_dir
            .join("services")
            .join(&self.service_name)
            .join("config")
    }

    pub fn get_log_path(&self) -> PathBuf {
        self.file_system.config_dir
            .join("services")
            .join(&self.service_name)
            .join("logs")
    }

    pub fn ensure_paths(&self) -> Result<(), ServiceError> {
        let paths = [
            self.get_socket_path(),
            self.get_config_path(),
            self.get_log_path(),
        ];

        for path in paths {
            self.file_system.mkdir(
                &path,
                &users::get_current_user()?,
                0o755,
            )?;
        }

        Ok(())
    }

    pub fn brew_command(&self, args: &[&str]) -> BrewCommand {
        BrewCommand::new(args)
    }
}
```

### 3. Create Base Service Trait
```rust
// src-tauri/lempifyd/services/mod.rs
pub trait Service {
    fn name(&self) -> &str;
    fn version(&self) -> &str;
    fn isolation(&self) -> &ServiceIsolation;
    
    fn is_running(&self) -> bool;
    fn is_installed(&self) -> bool;
    fn start(&self) -> Result<(), ServiceError>;
    fn stop(&self) -> Result<(), ServiceError>;
    fn restart(&self) -> Result<(), ServiceError>;
}
```

### 4. Service-Specific Implementation
```rust
// src-tauri/lempifyd/services/php.rs
pub struct PhpService {
    version: String,
    isolation: ServiceIsolation,
}

impl Service for PhpService {
    fn name(&self) -> &str {
        "php"
    }

    fn version(&self) -> &str {
        &self.version
    }

    fn isolation(&self) -> &ServiceIsolation {
        &self.isolation
    }

    fn is_installed(&self) -> bool {
        shared::brew::is_service_installed(&format!("php@{}", self.version))
    }

    fn is_running(&self) -> bool {
        shared::brew::is_service_running(&format!("php@{}", self.version))
    }

    fn start(&self) -> Result<(), ServiceError> {
        self.isolation.brew_command(&["services", "start", &format!("php@{}", self.version)])
            .run()
            .map_err(ServiceError::from)
    }

    // Implement other trait methods...
}
```

## Implementation Steps

1. **Phase 1: Core Structure**
   - Move `AppFileSystem` to `shared/src/file_system.rs`
   - Create new `services` module in `lempifyd`
   - Implement `ServiceIsolation` using `AppFileSystem`
   - Create base `Service` trait
   - Set up error handling types

2. **Phase 2: Service Implementations**
   - Implement PHP service using new structure and `brew.rs`
   - Add NGINX service implementation
   - Prepare for future services (MySQL, Redis)

3. **Phase 3: Configuration Management**
   - Implement service-specific configuration generators
   - Add configuration validation
   - Set up proper file permissions and ownership

4. **Phase 4: Testing & Validation**
   - Add unit tests for isolation mechanisms
   - Add integration tests for services
   - Validate service operations

## File Structure
```
src-tauri/
├── shared/
│   └── src/
│       ├── brew.rs
│       └── file_system.rs
└── lempifyd/
    └── services/
        ├── mod.rs
        ├── isolation.rs
        ├── error.rs
        ├── php.rs
        ├── mysql.rs
        ├── nginx.rs
        └── config.rs
```

## Benefits
1. Complete service isolation
2. Unified service management API
3. Consistent error handling
4. Better testability
5. Easier maintenance
6. Clear separation of concerns
7. Reuse of existing functionality
8. Future daemon capability
9. Core utilities properly placed in shared module

## Implementation Notes
- All services will use Lempify-specific paths via `AppFileSystem`
- Each service will have its own isolated environment
- Configuration files will be generated in Lempify-specific locations
- Log files will be stored in Lempify-specific directories
- Proper file permissions and ownership will be maintained
- Reuse `brew.rs` for Homebrew-related operations
- Leverage `AppFileSystem` for file operations and path management
- Service management kept within lempifyd for future daemon functionality
- Core utilities like `AppFileSystem` moved to shared module

## Migration Strategy
1. Create new modules alongside existing code
2. Gradually migrate functionality
3. Update existing code to use new modules
4. Remove deprecated code
5. Add comprehensive tests

## Notes
- Maintain backward compatibility during migration
- Add proper error types and handling
- Implement proper logging
- Add documentation for all public APIs

