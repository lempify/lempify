/// Maximum length of a full domain name (RFC 1035).
const MAX_DOMAIN_LEN: usize = 253;

/// Maximum length of a single dot-separated label (RFC 1035).
const MAX_LABEL_LEN: usize = 63;

/**
 * Validate a site domain before it reaches the filesystem, the hosts file, or a
 * privileged shell command.
 *
 * Accepts two or more dot-separated labels of lowercase ASCII letters, digits
 * and hyphens. Everything else is rejected — in particular quotes, semicolons,
 * spaces, slashes and `..`, any of which would otherwise be interpolated into
 * `osascript`'s `do shell script ... with administrator privileges` and run as
 * root.
 *
 * Callers should lowercase the domain first; uppercase input is rejected rather
 * than silently coerced so the caller's stored value always matches what was
 * validated.
 *
 * @example
 * ```
 * use shared::validate::validate_domain;
 * assert!(validate_domain("lempify.local").is_ok());
 * assert!(validate_domain("lempify").is_err());
 * ```
 */
pub fn validate_domain(domain: &str) -> Result<(), String> {
    if domain.is_empty() {
        return Err("Domain cannot be empty.".to_string());
    }

    if domain.len() > MAX_DOMAIN_LEN {
        return Err(format!(
            "Domain must be {} characters or fewer.",
            MAX_DOMAIN_LEN
        ));
    }

    let labels: Vec<&str> = domain.split('.').collect();

    if labels.len() < 2 {
        return Err(
            "Invalid domain. Domain must contain a name and TLD separated by a period (e.g., 'lempify.local')"
                .to_string(),
        );
    }

    for label in &labels {
        if label.is_empty() {
            return Err(
                "Invalid domain. Labels cannot be empty (e.g., 'lempify..local').".to_string(),
            );
        }

        if label.len() > MAX_LABEL_LEN {
            return Err(format!(
                "Invalid domain. Each label must be {} characters or fewer.",
                MAX_LABEL_LEN
            ));
        }

        if label.starts_with('-') || label.ends_with('-') {
            return Err("Invalid domain. Labels cannot start or end with a hyphen.".to_string());
        }

        if !label
            .chars()
            .all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '-')
        {
            return Err(
                "Invalid domain. Only lowercase letters, digits and hyphens are allowed."
                    .to_string(),
            );
        }
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn accepts_ordinary_domains() {
        for domain in [
            "lempify.local",
            "my-site.local",
            "a.b",
            "example.co.uk",
            "site123.test",
            "1.0",
        ] {
            assert!(validate_domain(domain).is_ok(), "expected ok: {}", domain);
        }
    }

    #[test]
    fn rejects_missing_tld() {
        assert!(validate_domain("lempify").is_err());
        assert!(validate_domain("").is_err());
    }

    #[test]
    fn rejects_empty_labels() {
        assert!(validate_domain("lempify..local").is_err());
        assert!(validate_domain(".local").is_err());
        assert!(validate_domain("lempify.").is_err());
    }

    #[test]
    fn rejects_hyphen_edges() {
        assert!(validate_domain("-lempify.local").is_err());
        assert!(validate_domain("lempify-.local").is_err());
    }

    #[test]
    fn rejects_uppercase() {
        assert!(validate_domain("Lempify.local").is_err());
    }

    /// The shapes that made Plan 02 exploitable: anything that could break out
    /// of a shell word or an AppleScript string literal.
    #[test]
    fn rejects_shell_and_applescript_metacharacters() {
        for domain in [
            r#"a";touch /tmp/pwned;".com"#,
            "a;touch /tmp/pwned.com",
            "a$(id).com",
            "a`id`.com",
            "a|id.com",
            "a&id.com",
            "a b.com",
            "a'b.com",
            "a\\b.com",
            "../../etc/passwd.com",
            "a/b.com",
            "a\nb.com",
        ] {
            assert!(
                validate_domain(domain).is_err(),
                "expected rejection: {}",
                domain
            );
        }
    }

    #[test]
    fn rejects_oversized_input() {
        let long_label = "a".repeat(MAX_LABEL_LEN + 1);
        assert!(validate_domain(&format!("{}.local", long_label)).is_err());

        let long_domain = format!("{}.local", "a.".repeat(MAX_DOMAIN_LEN));
        assert!(validate_domain(&long_domain).is_err());
    }
}
