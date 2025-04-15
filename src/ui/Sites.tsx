
import SiteCard from './SitesSite';
import CreateSite from "./SitesCreate";
import useSiteManager from "../hooks/useSiteManager";
import RouteHeader from './RouteHeader';

const Sites = () => {
  const { sites, loading, error, refresh } = useSiteManager();

  return (
    <div className="p-4">
      <RouteHeader title="Sites" description="Manage your sites" />
      {loading && <p>Loading sites...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}

      {sites.length === 0 && !loading && <p>No sites found in ~/Lempify/sites</p>}

      <CreateSite onRefresh={refresh} />

      <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sites.map(site => (
          <SiteCard onRefresh={refresh} site={site} />
        ))}
      </ul>
    </div>
  );
};

export default Sites;
