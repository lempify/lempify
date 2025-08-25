use std::process::Command;

pub fn run(script: &str, prompt: Option<&str>) -> Result<(), String> {
    if !cfg!(target_os = "macos") {
        return Err("Adding host entries is not implemented for this OS yet.".into());
    }

    let shell_prompt = prompt.unwrap_or(
        "Lempify needs permission to run this script. Please enter your macOS password. \n\nTo avoid this prompt in the future, you can Trust Lempify by clicking the lock icon in the top left corner of the app.",
    );

    let shell_script = format!(
        r#"do shell script "{}" with administrator privileges with prompt "{}""#,
        script, shell_prompt
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
