// scripts/build-daemon.js
import { execSync } from "child_process";
import { renameDaemon } from "./rename-daemon.js";
import { PLATFORMS } from "./constants.js";

const DAEMON_DIR = `src-tauri/src/bin/lempifyd`;

try {
  PLATFORMS.forEach(platform => {
    console.log(`Building ${DAEMON_DIR} for ${platform}!`);
    execSync(`cargo build --manifest-path=${DAEMON_DIR}/Cargo.toml --release --target ${platform} -p lempifyd`, { stdio: "inherit" });
    renameDaemon(platform);
  });
  console.log("✅ Done!");
} catch (err) {
  console.error("❌ Build failed:", err.message);
  process.exit(1);
}
