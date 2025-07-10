/**
 * External imports
 */
import { useCallback } from 'react';
import { NavLink } from 'react-router-dom';

/**
 * Internal imports
 */
// Components
import Loader from './Loader';
// Types
import { Site, SiteInfo } from '../types';
// Hooks
import { useInvoke } from '../hooks/useInvoke';
import { openInBrowser } from '../utils/tauri';
import { useAppConfig } from '../context/AppConfigContext';

/**
 * Handle events closure for the SitesSite component
 *
 * @param domain - The domain of the site
 * @param refresh - The refresh function
 * @param invoke - The invoke function
 *
 * @returns Closure for the events
 */
function handleEvents(
  domain: SiteInfo['domain'],
  success: () => void,
  error: (err: any) => void,
  invoke: (command: string, args: any) => Promise<any>,
  sites: Site[],
  dispatch: (action: any) => void
) {
  return {
    async deleteSite() {
      try {
        const { data } = await invoke('delete_site', { domain });
        if (data) {
          dispatch({ type: 'set_sites', sites: data });
        }
        success();
      } catch (err) {
        error(err);
      }
    },
    async addSsl() {
      try {
        const {
          data: { cert_path, key_path },
        } = await invoke('add_ssl', { domain });
        if (cert_path && key_path) {
          dispatch({
            type: 'set_sites',
            sites: sites.map(site => {
              if (site.domain === domain) {
                return {
                  ...site,
                  ssl: true,
                  site_config: {
                    ...site.site_config,
                    ssl: true,
                    ssl_key: key_path,
                    ssl_cert: cert_path,
                  },
                };
              }
              return site;
            }),
          });
        }
        success();
      } catch (err) {
        error(err);
      }
    },
  };
}

const btnClassName =
  'text-xs' +
  ' text-neutral-400 dark:text-neutral-300' +
  ' rounded-full' +
  ' border border-neutral-200 dark:border-neutral-700' +
  ' hover:bg-neutral-100 dark:hover:bg-neutral-800' +
  ' px-2 py-1';

/**
 * SitesSite component
 *
 * @param site - The site info
 * @param refresh - The refresh function
 */
function SiteCard({ site, refresh }: { site: Site; refresh: () => void }) {
  const { config, dispatch } = useAppConfig();
  const { domain, ssl: is_ssl } = site;
  const { invoke, invokeStatus } = useInvoke();
  const handleEvent = useCallback(
    () =>
      handleEvents(
        domain,
        refresh,
        err => console.error(err),
        invoke,
        config.sites,
        dispatch
      ),
    [domain, refresh, invoke]
  );

  async function openInTauriWindow() {
    try {
      await invoke('open_site_window', {
        domain: site.domain,
        ssl: site.ssl,
      });
    } catch (err) {
      console.error('Failed to open site window:', err);
    }
  }

  return (
    <div className={`relative group`}>
      <div className='p-4'>
        <header className={`flex gap-2`}>
          <h3 className='flex-1 text-lg relative italic text-neutral-600 dark:text-neutral-400 truncate group-hover:whitespace-normal group-hover:break-all'>
            <NavLink to={`/sites/${site.domain}`}>
              <span className='hidden group-hover:inline'>
                {domain}
              </span>
              <span className='group-hover:hidden'>{domain}</span>
            </NavLink>
          </h3>
          <div className='flex-shrink-0 mt-1'>
            {/* SSL cert generator */}
            <div
              className={`text-xs px-2 py-0.5 rounded-full ${is_ssl ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
              role='status'
              aria-live='polite'
            >
              {is_ssl ? (
                <>
                  <span aria-label='SSL certificate is active' role='img'>
                    🔒
                  </span>
                  <span className='sr-only'>SSL certificate is active</span>
                </>
              ) : (
                <button
                  onClick={handleEvent().addSsl}
                  className='text-red-800 hover:text-red-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 rounded'
                  aria-label={`Add SSL certificate for ${domain}`}
                >
                  Add SSL
                </button>
              )}
            </div>
          </div>
        </header>
        <div className='mt-3 flex gap-2'>
          <button
            onClick={() => openInBrowser(domain, is_ssl)}
            className={btnClassName}
          >
            Open
          </button>
          <button onClick={openInTauriWindow} className={btnClassName}>
            Preview
          </button>
          <button onClick={handleEvent().deleteSite} className={btnClassName}>
            Delete
          </button>
        </div>
      </div>
      <Loader isVisible={invokeStatus === 'pending'} size={20} />
    </div>
  );
}

export default SiteCard;
