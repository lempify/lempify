use std::fs;
use std::process::Command;

use crate::models::config::{Config, ConfigManager};
use shared::constants::{LEMPIFY_STAGED_HOSTS, LEMPIFY_STAGING_DIR, LEMPIFY_SUDOERS_PATH};
use tauri::State;

use shared::osascript;

/// One of the exact commands the policy grants, used to verify the install took
/// effect without needing a password.
const VERIFY_COMMAND: [&str; 3] = ["/bin/cp", LEMPIFY_STAGED_HOSTS, "/etc/hosts"];

/**
 * Build the scoped sudoers policy for `username`.
 *
 * This grants only the specific privileged file operations Lempify performs:
 * replacing `/etc/hosts`, and writing/removing nginx configuration under the
 * Homebrew prefix. It deliberately does NOT grant `NOPASSWD: ALL` — that would
 * hand passwordless root to every process running as this user, for as long as
 * the file exists.
 *
 * The command paths mirror the call sites in `shared::hosts` and
 * `shared::utils_legacy::FileSudoCommand`; changing either means changing this.
 */
fn sudoers_policy(username: &str) -> String {
    format!(
        "# Lempify — scoped privileges for local LEMP stack management.\n\
         #\n\
         # Installed by Lempify's Trust handshake so routine site operations do not\n\
         # prompt for a password. It grants ONLY the file operations listed below.\n\
         #\n\
         # Remove it from the app (Untrust), or by hand:\n\
         #   sudo rm {sudoers_path}\n\
         \n\
         Cmnd_Alias LEMPIFY_HOSTS = \\\n\
         \x20   /bin/cp {staged_hosts} /etc/hosts\n\
         \n\
         Cmnd_Alias LEMPIFY_NGINX = \\\n\
         \x20   /bin/mv {staging_dir}/* /opt/homebrew/etc/nginx/nginx.conf, \\\n\
         \x20   /bin/mv {staging_dir}/* /opt/homebrew/etc/nginx/sites-enabled/*.conf, \\\n\
         \x20   /bin/rm /opt/homebrew/etc/nginx/sites-enabled/*.conf\n\
         \n\
         {username} ALL=(ALL) NOPASSWD: LEMPIFY_HOSTS, LEMPIFY_NGINX\n",
        sudoers_path = LEMPIFY_SUDOERS_PATH,
        staged_hosts = LEMPIFY_STAGED_HOSTS,
        staging_dir = LEMPIFY_STAGING_DIR,
        username = username
    )
}

/**
 * Reject anything that is not a plain POSIX username.
 *
 * The value comes from `whoami`, but it is interpolated into a sudoers rule, so
 * a newline or space would let extra directives be injected into the policy.
 */
fn validate_username(username: &str) -> Result<(), String> {
    if username.is_empty() {
        return Err("Could not determine the current username.".to_string());
    }

    if !username
        .chars()
        .all(|c| c.is_ascii_alphanumeric() || c == '_' || c == '-' || c == '.')
    {
        return Err(format!(
            "Refusing to write a sudoers rule for unexpected username: {}",
            username
        ));
    }

    Ok(())
}

/**
 * Syntax-check a candidate sudoers file with visudo before it is installed.
 *
 * A malformed file in `/etc/sudoers.d` can break `sudo` for the whole machine,
 * so a definitive failure aborts the install. If visudo cannot be run at all we
 * proceed — the policy is a fixed template and the only variable part
 * (`username`) has already been validated.
 */
fn check_sudoers_syntax(path: &std::path::Path) -> Result<(), String> {
    let output = Command::new("/usr/sbin/visudo")
        .args(["-c", "-f"])
        .arg(path)
        .output();

    match output {
        Ok(out) if !out.status.success() => Err(format!(
            "Generated sudoers file failed validation and was not installed: {}{}",
            String::from_utf8_lossy(&out.stdout).trim(),
            String::from_utf8_lossy(&out.stderr).trim()
        )),
        _ => Ok(()),
    }
}

#[tauri::command]
pub async fn trust_lempify(config_manager: State<'_, ConfigManager>) -> Result<Config, String> {
    let username = Command::new("whoami")
        .output()
        .map_err(|e| format!("Failed to get username: {}", e))?;
    let username = String::from_utf8_lossy(&username.stdout).trim().to_string();

    validate_username(&username)?;

    let temp_file = std::env::temp_dir().join("tauri-sudoers");
    fs::write(&temp_file, sudoers_policy(&username))
        .map_err(|e| format!("Failed to write temporary file: {}", e))?;

    check_sudoers_syntax(&temp_file)?;

    let temp_file_str = temp_file.to_str().ok_or("Invalid temporary file path")?;

    osascript::run(
        &format!(
            "/bin/mv {temp_file} {sudoers_path} && /usr/sbin/chown root:wheel {sudoers_path} && /bin/chmod 440 {sudoers_path}",
            temp_file = osascript::shell_quote(temp_file_str),
            sudoers_path = osascript::shell_quote(LEMPIFY_SUDOERS_PATH)
        ),
        Some("Lempify needs permission to perform Trust Handshake. Please enter your macOS password."),
    ).map_err(|e| format!("Failed to execute osascript: {}", e))?;

    // Verify one of the granted commands resolves without a password prompt.
    // `-n` keeps this non-interactive; `-l` asks whether the command is allowed
    // rather than running it.
    let output = Command::new("sudo")
        .args(["-n", "-l"])
        .args(VERIFY_COMMAND)
        .output()
        .map_err(|e| format!("Failed to verify sudo access: {}", e))?;

    if !output.status.success() {
        return Err(format!(
            "Trust handshake did not take effect: {}",
            String::from_utf8_lossy(&output.stderr).trim()
        ));
    }

    config_manager.set_trusted(true).await?;

    Ok(config_manager.get_config().await)
}

#[tauri::command]
pub async fn untrust_lempify(config_manager: State<'_, ConfigManager>) -> Result<Config, String> {
    #[cfg(target_os = "macos")]
    let output = {
        let script = format!(
            "do shell script \"/bin/rm {}\" with administrator privileges",
            osascript::shell_quote(LEMPIFY_SUDOERS_PATH)
        );
        Command::new("osascript")
            .args(["-e", &script])
            .output()
            .map_err(|e| format!("Failed to execute osascript: {}", e))?
    };

    if !output.status.success() {
        return Err(format!(
            "Failed to remove sudoers file: {}",
            String::from_utf8_lossy(&output.stderr)
        ));
    }

    config_manager.set_trusted(false).await?;

    let config = config_manager.get_config().await;

    Ok(config)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn policy_never_grants_blanket_root() {
        let policy = sudoers_policy("someone");
        assert!(
            !policy.contains("NOPASSWD: ALL"),
            "policy must not grant unrestricted sudo"
        );
    }

    #[test]
    fn policy_grants_only_the_expected_commands() {
        let policy = sudoers_policy("someone");
        assert!(policy.contains("/bin/cp /tmp/lempify-staging/hosts /etc/hosts"));
        assert!(policy
            .contains("/bin/mv /tmp/lempify-staging/* /opt/homebrew/etc/nginx/nginx.conf"));
        assert!(policy.contains(
            "/bin/mv /tmp/lempify-staging/* /opt/homebrew/etc/nginx/sites-enabled/*.conf"
        ));
        assert!(policy.contains("/bin/rm /opt/homebrew/etc/nginx/sites-enabled/*.conf"));
        assert!(policy.contains("someone ALL=(ALL) NOPASSWD: LEMPIFY_HOSTS, LEMPIFY_NGINX"));
    }

    /// The regression that broke site deletion: `std::env::temp_dir()` resolves
    /// to `$TMPDIR` (`/var/folders/...`) on macOS, so any policy naming a
    /// staged file must use the fixed staging directory, never a temp_dir path.
    #[test]
    fn policy_paths_match_where_files_are_actually_staged() {
        let policy = sudoers_policy("someone");
        assert!(
            !policy.contains("/var/folders"),
            "policy must not reference the per-user TMPDIR"
        );
        assert!(
            policy.contains(LEMPIFY_STAGING_DIR),
            "policy must reference the staging directory the code writes to"
        );

        // Mirrors FileSudoCommand::run_write's staging path construction.
        let staged = std::path::Path::new(LEMPIFY_STAGING_DIR).join("example.local.conf");
        assert!(staged.starts_with(LEMPIFY_STAGING_DIR));
    }

    /// A malformed drop-in can break `sudo` for the whole machine, so the
    /// generated policy must parse. Skipped where visudo is unavailable.
    #[test]
    fn policy_passes_visudo() {
        if !std::path::Path::new("/usr/sbin/visudo").exists() {
            return;
        }

        let path = std::env::temp_dir().join("lempify-sudoers-policy-test");
        fs::write(&path, sudoers_policy("someone")).expect("write temp policy");

        let result = check_sudoers_syntax(&path);
        let _ = fs::remove_file(&path);

        assert!(result.is_ok(), "{}", result.unwrap_err());
    }

    #[test]
    fn username_validation_rejects_injection() {
        assert!(validate_username("jared").is_ok());
        assert!(validate_username("first.last-1_2").is_ok());
        assert!(validate_username("").is_err());
        assert!(validate_username("jared\nroot ALL=(ALL) NOPASSWD: ALL").is_err());
        assert!(validate_username("jared root").is_err());
        assert!(validate_username("jared,root").is_err());
    }
}
