import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-shell';

import { SiteInfo } from "../types";

const SiteCard = ({ site, onRefresh }: { site: SiteInfo, onRefresh: () => void }) => {

  function openInBrowser(site: { name: string }) {
    const tld = "test";
    const url = `http://${site.name}.${tld}`;
    open(url); // ← uses system default browser
  }

  const handleDelete = async (siteName: string) => {
    try {
      const result = await invoke<string>("delete_site", { name: siteName });
      console.log(result); // or toast it
      onRefresh(); // or navigate away
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  return (
    <div className="p-4 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold text-[var(--lempify-accent)]">{site.name}</h3>
      <span className={`text-xs px-2 py-0.5 rounded-full ${site.in_hosts ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
        {site.in_hosts ? 'Mapped' : 'Not mapped'}
      </span>
    </div>
    <p className="text-sm text-neutral-600 dark:text-neutral-400">{site.domain}</p>
    <div className="mt-3 flex gap-2">
      <button onClick={() => openInBrowser(site)} className="text-sm text-[var(--lempify-accent)] hover:underline">Open</button>
        <button onClick={() => handleDelete(site.name)} className="text-sm text-red-500 hover:underline">Delete</button>
      </div>
    </div>
  );
};

export default SiteCard;
