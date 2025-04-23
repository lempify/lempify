import { SiteInfo } from "../types";
import { open } from '@tauri-apps/plugin-shell';

/**
 * Open a browser window to the given domain. Uses the `open` function from the `@tauri-apps/plugin-shell` package.
 * 
 * @example
 * ```ts
 * openInBrowser("example.com");
 * openInBrowser("example.com", true);
 * ```
 * 
 * @see https://v2.tauri.app/reference/javascript/shell/
 * 
 * @param domain - The domain to open in the browser
 * @param is_ssl - Whether the site has SSL
 */
export function openInBrowser(domain: SiteInfo["domain"], is_ssl: SiteInfo["is_ssl"] = false) {
    open(is_ssl ? `https://${domain}` : `http://${domain}`);
}