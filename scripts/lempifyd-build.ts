/**
 * Builds the daemon for all supported OS architectures.
 *
 * @example
 * `pnpm daemon:build`
 */
import { execSync } from 'child_process';
import { SUPPORTED_OSS, LEMPIFYD_DIR } from './constants.ts';

try {
  SUPPORTED_OSS.forEach(platform => {
    // Build the daemon for the given supported OS, using manifest path to target the correct package.
    execSync(
      `cargo build --manifest-path=${LEMPIFYD_DIR}/Cargo.toml --release --target ${platform} -p lempifyd`,
      { stdio: 'inherit' }
    );
    // renameDaemon(platform);
    console.log(`Daemon built for ${platform}`);
  });
} catch (err) {
  console.error(`Build failed: ${err.message ?? 'Unknown error'}`);
  process.exit(1);
}
