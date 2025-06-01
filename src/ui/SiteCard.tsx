/**
 * External imports
 */
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Internal imports
 */
// Components
import Loader from './Loader';
// Types
import { SiteInfo } from "../types";
// Hooks
import { useInvoke } from '../hooks/useInvoke';
import { openInBrowser } from '../utils/tauri';

/**
 * Handle events closure for the SitesSite component
 * 
 * @param domain - The domain of the site
 * @param refresh - The refresh function
 * @param invoke - The invoke function
 *
 * @returns Closure for the events
 */
const handleEvents = (domain: SiteInfo["domain"], refresh: () => void, invoke: (command: string, args: any) => Promise<any>) => {
  return {
    async deleteSite() {
      try {
        const result = await invoke("delete_site", { domain });
        console.log(result);
        refresh();
      } catch (err) {
        console.error("Delete failed", err);
      }
    },
    async addSsl() {
      try {
        const result = await invoke("add_ssl", { domain });
        console.log(result);
        refresh();
      } catch (err) {
        console.error("Add SSL failed", err);
      }
    },
    async addNginxConfig() {
      try {
        const result = await invoke("generate_nginx_config", { domain });
        console.log(result);
        refresh();
      } catch (err) {
        console.error("Generate Nginx config failed", err);
      }
    }
  }
}

/**
 * SitesSite component
 * 
 * @param site - The site info
 * @param refresh - The refresh function
 */
function SiteCard({ site, refresh }: { site: SiteInfo, refresh: () => void }) {

  const { domain, is_ssl } = site;
  const { invoke, invokeStatus } = useInvoke();
  const handleEvent = useCallback(() => handleEvents(domain, refresh, invoke), [domain, refresh, invoke]);

  const navigate = useNavigate();

  const editSite = () => {
    navigate(`/site/${site.domain}`);
  }

  return (
    <div className={`relative`}>
      <div className="p-4 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800">
        <div className={`flex justify-between items-center mb-2`}>
          <h3 className="text-lg font-semibold text-[var(--lempify-primary)]">{domain}</h3>
          <div className="flex gap-2">
            {/* NGINX config generator */}
            <span className={`text-xs px-2 py-0.5 rounded-full ${site.config_path ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {site.config_path ? 'Mapped' : <button onClick={handleEvent().addNginxConfig}>Add Config</button>}
            </span>
            {/* SSL cert generator */}
            <span className={`text-xs px-2 py-0.5 rounded-full ${is_ssl ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {is_ssl ? '🔒 Secure' : <button onClick={handleEvent().addSsl}>Add SSL</button>}
            </span>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <button onClick={editSite} className="text-sm text-[var(--lempify-primary)] hover:underline">Edit</button>
          <button onClick={() => openInBrowser(domain, is_ssl)} className="text-sm text-[var(--lempify-primary)] hover:underline">Open</button>
          <button onClick={handleEvent().deleteSite} className="text-sm text-red-500 hover:underline">Delete</button>
        </div>
      </div>
      <Loader isVisible={invokeStatus === 'pending'} />
    </div>
  );
};

export default SiteCard;
