// Helpers for managing stubs

use std::{fs, path::PathBuf};

use crate::helpers::file_system::AppFileSystem;

#[derive(Debug)]
struct Stub {
    stub_dir_name: String,
    stub_path: PathBuf,
    domain: String,
}

impl Stub {
    pub fn new(site_type: &str, domain: &str) -> Result<Self, String> {
        let app_file_system = AppFileSystem::new()?;
        let stub_path = app_file_system.stubs_dir.join(site_type);
        Ok(Stub {
            stub_dir_name: site_type.to_string(),
            stub_path,
            domain: domain.to_string(),
        })
    }

    pub fn get_stub_contents(&self) -> Result<Vec<String>, String> {
        let app_file_system = AppFileSystem::new()?;
        let stub_path = app_file_system.stubs_dir.join(&self.stub_dir_name);
        let mut stub_contents = Vec::new();
        for entry in fs::read_dir(stub_path).map_err(|e| format!("Failed to read stub: {}", e))? {
            let entry = entry.map_err(|e| format!("Failed to read stub: {}", e))?; // TODO: Handle this error
            stub_contents.push(entry.path().to_string_lossy().to_string());
        }
        Ok(stub_contents)
    }
}

/**
 * Get local stub directory contents.
 */
pub fn create_site_type_stub(site_type: &str, domain: &str) -> Result<(), String> {
    let stub = Stub::new(&site_type, domain)?;
    println!("Stub: {:?}", stub);
    let stub_contents = stub.get_stub_contents()?;
    println!("Stub contents: {:?}", stub_contents);
    // Copy stub contents to site directory
    let site_dir = AppFileSystem::new()?.sites_dir.join(domain);
    for stub_content in stub_contents.iter() {
        let file_name = stub_content.split("/").last().unwrap();
        let destination_path = site_dir.join(file_name);
        fs::copy(stub_content, destination_path)
            .map_err(|e| format!("Failed to copy file: {}", e))?;
    }
    Ok(())
}
