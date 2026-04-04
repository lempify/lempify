// Parses a versioned service name like `"php@8.4"` into `("php", Some("8.4"))`.
// For unversioned names like `"nginx"`, returns `("nginx", None)`.
pub fn parse_service_name(name: &str) -> (&str, Option<&str>) {
    match name.split_once('@') {
        Some((service, version)) => (service, Some(version)),
        None => (name, None),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_versioned_service() {
        assert_eq!(parse_service_name("php@8.4"), ("php", Some("8.4")));
    }

    #[test]
    fn parses_unversioned_service() {
        assert_eq!(parse_service_name("nginx"), ("nginx", None));
    }

    #[test]
    fn parses_each_supported_php_version() {
        for version in ["8.5", "8.4", "8.3", "8.2", "8.1", "8.0"] {
            let name = format!("php@{version}");
            assert_eq!(
                parse_service_name(&name),
                ("php", Some(version)),
                "failed for php@{version}"
            );
        }
    }

    #[test]
    fn split_once_takes_first_at_sign() {
        // split_once('@') stops at the first '@', rest goes to the version slice
        assert_eq!(
            parse_service_name("php@8.4@extra"),
            ("php", Some("8.4@extra"))
        );
    }
}
