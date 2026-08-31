use std::process::Command;

/**
 * Quote a single value for safe interpolation into a POSIX shell command.
 *
 * Wraps the value in single quotes and escapes any embedded single quote, so
 * shell metacharacters (`;`, `&`, `$`, backticks, spaces, quotes) are treated
 * as literal text. Every caller-supplied path that ends up inside a `run`
 * script must go through this.
 *
 * @example
 * ```
 * use shared::osascript::shell_quote;
 * let script = format!("rm {}", shell_quote("/path/with spaces"));
 * assert_eq!(script, "rm '/path/with spaces'");
 * ```
 */
pub fn shell_quote(value: &str) -> String {
    format!("'{}'", value.replace('\'', r"'\''"))
}

/**
 * Escape a value for inclusion in an AppleScript double-quoted string literal.
 *
 * Without this, a value containing `"` closes the literal early and the rest is
 * parsed as AppleScript. Because the surrounding statement is `do shell script
 * ... with administrator privileges`, that is arbitrary code execution as root.
 */
fn applescript_escape(value: &str) -> String {
    value.replace('\\', r"\\").replace('"', "\\\"")
}

/**
 * Run a script with administrator privileges using osascript if user has not trusted the app yet
 *
 * `script` is a shell command line. Interpolated values must already be passed
 * through [`shell_quote`] by the caller — this function escapes the result for
 * the AppleScript layer, but it cannot know which parts of the string are meant
 * to be shell syntax and which are data.
 *
 * @param script: The script to run
 * @param prompt: The prompt to display
 * @returns: Result<(), String>
 * @example
 * ```
 * osascript::run("echo 'Hello, world!'", Some("Please enter your password."));
 * ```
 */
pub fn run(script: &str, prompt: Option<&str>) -> Result<(), String> {
    if !cfg!(target_os = "macos") {
        return Err("Adding host entries is not implemented for this OS yet.".into());
    }

    let shell_prompt = prompt.unwrap_or(
        "Lempify neds permission to run this command. Please enter your mac password. \n\nTo avoid this prompt in the future, you can Trust Lempify by clicking the lock icon in the top left corner of the app.",
    );

    let shell_script = format!(
        r#"do shell script "{}" with administrator privileges with prompt "{}""#,
        applescript_escape(script),
        applescript_escape(shell_prompt)
    );

    let status = Command::new("osascript")
        .arg("-e")
        .arg(shell_script)
        .status()
        .map_err(|e| format!("Failed to run osascript: {}", e))?;

    if status.success() {
        Ok(())
    } else {
        Err("osascript failed".into())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn shell_quote_wraps_plain_values() {
        assert_eq!(shell_quote("/etc/hosts"), "'/etc/hosts'");
    }

    #[test]
    fn shell_quote_neutralises_metacharacters() {
        let quoted = shell_quote("a\";touch /tmp/pwned;\".conf");
        assert_eq!(quoted, "'a\";touch /tmp/pwned;\".conf'");
        // No unquoted separator survives, so `sh` sees a single word.
        assert!(!quoted.contains("';"));
    }

    #[test]
    fn shell_quote_escapes_embedded_single_quotes() {
        // Closes the quote, emits an escaped literal quote, reopens it.
        assert_eq!(shell_quote("it's"), r"'it'\''s'");
    }

    #[test]
    fn applescript_escape_neutralises_quotes_and_backslashes() {
        assert_eq!(applescript_escape(r#"a"b"#), r#"a\"b"#);
        assert_eq!(applescript_escape(r"a\b"), r"a\\b");
        // Backslash first, so an escaped quote is not double-escaped.
        assert_eq!(applescript_escape(r#"a\"b"#), r#"a\\\"b"#);
    }

    #[test]
    fn layered_quoting_contains_no_bare_double_quote() {
        let script = format!("rm {}", shell_quote(r#"/x/a";id;".conf"#));
        let escaped = applescript_escape(&script);
        // Every `"` reaching AppleScript is backslash-escaped.
        for (i, c) in escaped.char_indices() {
            if c == '"' {
                assert!(i > 0 && escaped.as_bytes()[i - 1] == b'\\', "bare quote at {}", i);
            }
        }
    }
}
