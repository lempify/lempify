import { open } from '@tauri-apps/plugin-shell';

import { SiteInfo } from "../types";
import { useInvoke } from '../hooks/useInvoke';

function openInBrowser(domain: SiteInfo["domain"]) {
  const url = `http://${domain}`;
  open(url);
}

const SiteCard = ({ site, refresh }: { site: SiteInfo, refresh: () => void }) => {

  const { invoke, invokeStatus } = useInvoke();
  const { domain } = site;

  const handleDelete = async () => {
    try {
      const result = await invoke<string>("delete_site", { domain });
      console.log(result);
      refresh();
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  const handleGenerateNginxConfig = async () => {
    try {
      const result = await invoke<string>("generate_nginx_config", { domain });
      console.log(result);
      refresh();
    } catch (err) {
      console.error("Generate Nginx config failed", err);
    }
  };

  const nginxMapped = site.config_path ?
    'Mapped' :
    <button onClick={handleGenerateNginxConfig} className="text-sm">Add .conf</button>;

  return (
    <div className="p-4 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800">
      {invokeStatus}
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold text-[var(--lempify-primary)]">{site.name}</h3>
        <span className={`text-xs px-2 py-0.5 rounded-full ${site.config_path ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {nginxMapped}
        </span>
      </div>
      <p className="text-sm text-neutral-600 dark:text-neutral-400">{domain}</p>
      <div className="mt-3 flex gap-2">
        <button onClick={() => openInBrowser(domain)} className="text-sm text-[var(--lempify-primary)] hover:underline">Open</button>
        <button onClick={() => handleDelete()} className="text-sm text-red-500 hover:underline">Delete</button>
      </div>
      <pre>{JSON.stringify(site, null, 2)}</pre>
    </div>
  );
};

export default SiteCard;
