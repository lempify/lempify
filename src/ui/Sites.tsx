
import SiteCard from './SitesSite';
import CreateSite from "./SitesCreate";
import useSiteManager from "../hooks/useSiteManager";

const Sites = () => {
  const { sites, loading, error, refresh } = useSiteManager();

  return (
    <div className="p-4">
      <h2 className="text-8xl w-full text-transparent bg-clip-text font-extrabold bg-gradient-to-r from-[var(--lempify-accent)] to-[var(--lempify-secondary)] mb-20">Sites</h2>
      {loading && <p>Loading sites...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}

      {sites.length === 0 && !loading && <p>No sites found in ~/Lempify/sites</p>}

      <CreateSite onRefresh={refresh} />

      <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sites.map(site => (
          // <li key={site.name} className="border p-3 rounded shadow">
          //   <h3 className="text-lg font-bold">{site.name}</h3>
          //   <p className="text-sm text-gray-600">{site.domain}</p>
          //   <button
          //     onClick={() => openInBrowser(site)}
          //     className="btn mt-2 bg-blue-600 text-white hover:bg-blue-700"
          //   >
          //     Open in Browser
          //   </button>
          //   <button
          //     onClick={() => handleDelete(site.name)}
          //     className="btn mt-2 bg-red-600 text-white hover:bg-red-700"
          //   >
          //     Delete
          //   </button>
          // </li>
          <SiteCard onRefresh={refresh} site={site} />
        ))}
      </ul>
    </div>
  );
};

export default Sites;
