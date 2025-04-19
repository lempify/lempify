
import SiteCard from './SitesSite';
import SiteCreate from "./SitesCreate";
import useSiteManager from "../hooks/useSiteManager";
import RouteHeader from './RouteHeader';

const Sites = () => {
  const { sites, loading, error, refresh } = useSiteManager();

  return (
    <div className="p-4">
      <RouteHeader title="Sites" description="Manage your sites" />
      {loading && <p>Loading sites...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}

      <SiteCreate onRefresh={refresh} />

      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl text-[var(--lempify-primary)] to-[var(--lempify-primary-700)]">Existing Sites:</h2>
        <button onClick={refresh} className="btn">Refresh</button>
      </div>
      {sites.length ? <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sites.map(site => (
          <SiteCard key={site.name} refresh={refresh} site={site} />
        ))}
      </ul> : <p>No sites found in ~/Lempify/sites</p>}
    </div>
  );
};

export default Sites;
