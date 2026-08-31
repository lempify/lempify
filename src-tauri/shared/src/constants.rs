pub const DEFAULT_PHP_VERSION: &str = "8.5";

pub const PHP_SUPPORTED_VERSIONS: &[&str] = &["8.5", "8.4", "8.3", "8.2", "8.1", "8.0"];

pub const HOSTS_PATH: &str = "/etc/hosts";

/// Private directory holding files staged for a privileged copy/move.
///
/// Deliberately NOT `std::env::temp_dir()`: on macOS that resolves to the
/// per-user `$TMPDIR` (`/var/folders/<hash>/T/`), which is unpredictable and so
/// cannot be named in a sudoers rule. A fixed 0700 directory keeps the policy
/// exact and stops another local user swapping a staged file between the write
/// and the privileged copy.
pub const LEMPIFY_STAGING_DIR: &str = "/tmp/lempify-staging";

/// Staged replacement for `/etc/hosts`. A single fixed name, shared by add and
/// remove, so the sudoers rule needs no wildcard at all.
pub const LEMPIFY_STAGED_HOSTS: &str = "/tmp/lempify-staging/hosts";

/// Private directory holding the daemon's control socket.
///
/// Kept separate from `/tmp/lempify` (which holds the PHP-FPM sockets nginx
/// must reach) so it can be locked to 0700 without breaking site traffic.
/// Stays under `/tmp` rather than Application Support because a unix socket
/// path is limited to 104 bytes on macOS and a long username would overflow it.
pub const LEMPIFYD_SOCKET_DIR: &str = "/tmp/lempify-ipc";

pub const LEMPIFYD_SOCKET_PATH: &str = "/tmp/lempify-ipc/lempifyd.sock";

pub const SUDOERS_DIR: &str = "/etc/sudoers.d/";

pub const LEMPIFY_SUDOERS_PATH: &str = "/etc/sudoers.d/lempify";
