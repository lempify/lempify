import { execSync } from "child_process";
import { PLATFORMS } from "./constants.js";

export function renameDaemon(platform = PLATFORMS[0]) {
    try {
        execSync(`mv src/bin/lempifyd/target/${platform}/release/lempifyd src/bin/lempifyd/target/${platform}/release/lempifyd-${platform}`);
    } catch (error) {
        console.error("❌ Failed to rename daemon:", error);
    }
}

// Run rename if called directly
if (import.meta.url.includes(process.argv.at(1) ?? "")) {
    renameDaemon();
}
