import { execSync } from "child_process";
import { PLATFORMS } from "./constants.js";

const CALLED_DIRECTLY = import.meta.url.includes(process.argv.at(1) ?? "");

export function renameDaemon(platform = PLATFORMS[0]) {
    try {
        console.log(`Moving daemon to ${platform}. ${CALLED_DIRECTLY ? "Called directly" : "Called from script"}`);
        execSync('pwd', { stdio: 'inherit' });
        if (CALLED_DIRECTLY) {
            execSync(`mv src/bin/lempifyd/target/${platform}/release/lempifyd src/bin/lempifyd/target/${platform}/release/lempifyd-${platform}`);
        } else {
            execSync(`mv src-tauri/src/bin/lempifyd/target/${platform}/release/lempifyd src-tauri/src/bin/lempifyd/target/${platform}/release/lempifyd-${platform}`);
        }
    } catch (error) {
        console.error("❌ Failed to rename daemon:", error);
    }
}

// Run rename if called directly
if (import.meta.url.includes(process.argv.at(1) ?? "")) {
    renameDaemon();
}
