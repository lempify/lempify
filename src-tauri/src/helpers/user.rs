use users::{get_effective_username, User, get_user_by_name};

pub fn get_current() -> Result<User, String> {
    // Try to get sudo user first
    if let Ok(sudo_user) = std::env::var("SUDO_USER") {
        return get_user_by_name(&sudo_user)
            .ok_or_else(|| format!("Could not find user: {}", sudo_user));
    }
    
    // Fall back to current user
    let username = get_effective_username()
        .ok_or_else(|| "Could not get username".to_string())?
        .to_string_lossy()
        .into_owned();
    
    get_user_by_name(&username)
        .ok_or_else(|| format!("Could not find user: {}", username))
}