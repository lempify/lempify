import { Fragment } from "react";

import Loader from './Loader';
import SiteCard from './SitesSite';
import SiteCreate from "./SitesCreate";
import RouteHeader from './RouteHeader';
import SvgRefresh from './SvgRefresh';

import useSiteManager from "../hooks/useSiteManager";

const Sites = () => {
  const { sites, loading, error, refresh } = useSiteManager();

  return (
    <Fragment>
      <RouteHeader title="Sites" description="Manage your sites" />
      {error && <p className="text-red-500">Error: {error}</p>}
      <SiteCreate onRefresh={refresh} />

      <div className="mb-8 relative">
        <header className="flex items-center gap-2 mb-8">
          <h2 className="text-2xl text-[var(--lempify-primary)] to-[var(--lempify-primary-700)]">Existing Sites:</h2>
          <button onClick={refresh} className="hover:rotate-270 transition-transform duration-300 ml-auto">
            <SvgRefresh />
          </button>
        </header>
        {sites.length ? <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sites.map(site => (
            <SiteCard key={site.name} refresh={refresh} site={site} />
          ))}
        </ul> : <p>No sites found in ~/Lempify/sites</p>}
        <Loader isVisible={loading} />
      </div>
    </Fragment>
  );
};

export default Sites;
