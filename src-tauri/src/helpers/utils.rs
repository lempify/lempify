use mysql::{Pool, PooledConn};
use once_cell::sync::Lazy;
use regex::Regex;
use std::{fs, io, path::PathBuf};

/**
 * This regex is used to extract the version from the service output.
 * It matches the version in the following formats:
 * - PHP 8.4.24
 * - Ver 1.23.0
 * - nginx/1.23.0
 */
#[allow(dead_code)]
static VERSION_REGEX: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"(?m)(?:PHP\s+|Ver\s+|nginx/)(?P<version>\d+(?:\.\d+)*)").expect("invalid regex")
});

#[allow(dead_code)]
fn extract_version(input: &str) -> Option<String> {
    VERSION_REGEX
        .captures(input)
        .and_then(|caps| caps.name("version").map(|m| m.as_str().to_owned()))
}

/**
 * This function is used to copy a directory recursively.
 * It will copy the directory and all its subdirectories and files to the destination path.
 *
 * @param src - The source path
 * @param dest - The destination path
 * @returns A Result with an error message if the operation fails
 *
 * @example
 * ```
 * let src = PathBuf::from("/path/to/source");
 * let dest = PathBuf::from("/path/to/destination");
 * let result = copy_dir_recursive(&src, &dest);
 * ```
 */
pub fn copy_dir_recursive(src: &PathBuf, dest: &PathBuf) -> Result<(), String> {
    if !src.exists() {
        return Err(format!("Source path does not exist: {}", src.display()));
    }

    if src.is_dir() {
        fs::create_dir_all(dest).map_err(|e| format!("Failed to create directory: {}", e))?;
        for entry in fs::read_dir(src).map_err(|e| format!("Failed to read directory: {}", e))? {
            let entry = entry.map_err(|e| format!("Failed to read directory entry: {}", e))?;
            let path = entry.path();
            let file_name = path.file_name().unwrap();
            copy_dir_recursive(&path, &dest.join(file_name))?;
        }
    } else {
        fs::copy(src, dest).map_err(|e| {
            format!(
                "Failed to copy file: {} - {} - {}",
                e,
                src.display(),
                dest.display()
            )
        })?;
    }
    Ok(())
}

/**
 * This function is used to copy a zip entry to a path.
 * It will copy the zip entry to the destination path.
 *
 * @param file - The zip file entry to copy
 * @param outpath - The destination path
 * @returns A Result with an error message if the operation fails
 *
 * @example
 * ```
 * let file = zip::read::ZipFile::new(file);
 * let outpath = PathBuf::from("/path/to/destination");
 * let result = copy_zip_entry_to_path(&mut file, &outpath);
 * ```
 */
pub fn copy_zip_entry_to_path<R: io::Read + io::Seek>(
    file: &mut zip::read::ZipFile<R>,
    outpath: &PathBuf,
) -> Result<(), String> {
    if file.is_dir() {
        fs::create_dir_all(outpath).map_err(|e| format!("Failed to create directory: {}", e))?;
    } else {
        if let Some(p) = outpath.parent() {
            if !p.exists() {
                fs::create_dir_all(p).map_err(|e| format!("Failed to create directory: {}", e))?;
            }
        }
        let mut outfile =
            fs::File::create(outpath).map_err(|e| format!("Failed to create file: {}", e))?;
        io::copy(file, &mut outfile).map_err(|e| format!("Failed to copy file: {}", e))?;
    }
    Ok(())
}

/**
 * This function is used to get a MySQL connection.
 * It will return a PooledConn if the connection is successful.
 *
 * @param mysql_host - The MySQL host
 * @param mysql_user - The MySQL user
 * @param mysql_password - The MySQL password
 * @param mysql_port - The MySQL port
 * @returns A Result with an error message if the connection fails
 *
 * @example
 * ```
 * let mysql_host = "localhost";
 * let mysql_user = "root";
 * let mysql_password = "password";
 * let mysql_port = 3306;
 * let result = get_mysql_connection(mysql_host, mysql_user, mysql_password, mysql_port);
 * ```
 */
pub fn get_mysql_connection(
    mysql_host: String,
    mysql_user: String,
    mysql_password: String,
    mysql_port: u16,
) -> Result<PooledConn, String> {
    let conn_str = format!(
        "mysql://{}:{}@{}:{}/",
        mysql_user, mysql_password, mysql_host, mysql_port
    );
    let pool =
        Pool::new(conn_str.as_str()).map_err(|e| format!("Failed to connect to MySQL: {}", e))?;

    let conn = pool
        .get_conn()
        .map_err(|e| format!("Failed to get MySQL connection: {}", e))?;

    Ok(conn)
}
