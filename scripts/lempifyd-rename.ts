/**
 * Small node script for renaming the daemon binary after it's built.
 * 
 * This is necessary since Tauri will load an external binary the OS triplet name appended to it.
 * 
 * @example
 * `my-binary` -> `my-binary-aarch64-apple-darwin`
 * `my-binary` -> `my-binary-x86_64-apple-darwin`
 */

import { execSync } from "child_process";
import { RELEASE_DIR, SUPPORTED_OSS } from "./constants.ts";

try {
    SUPPORTED_OSS.forEach(platform => {
        execSync(
            `cp ${RELEASE_DIR}/${platform}/release/lempifyd ${RELEASE_DIR}/${platform}/release/lempifyd-${platform}`
        );
        console.log(`[lempifyd]: Renamed for ${platform}`);
    });
} catch (error) {
    console.error("❌ Failed to rename daemon:", error);
}
