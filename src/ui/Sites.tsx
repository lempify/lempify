import Loader from './Loader';
import SiteCard from './SitesSite';
import SiteCreate from "./SitesCreate";
import SvgRefresh from './SvgRefresh';

import useSiteManager from "../hooks/useSiteManager";
import { corderBottomLeft } from "./css";
import Page from "./Page";

const Sites = () => {
  const { sites, loading, error, refresh } = useSiteManager();

  return (
    <Page title="Sites" description="Manage your sites">
      {error && <p className="text-red-500">Error: {error}</p>}
      <SiteCreate onRefresh={refresh} />
      <div className={`p-10 w-full border border-neutral-200 border-t-0 dark:border-neutral-700 relative ${corderBottomLeft}`}>
        <header className="flex items-center gap-2 mb-8">
          <h2 className="text-4xl text-[var(--lempify-primary)] to-[var(--lempify-primary-700)]">Create New Site</h2>
          <button onClick={refresh} className="hover:rotate-270 transition-transform duration-300 ml-auto">
            <SvgRefresh />
          </button>
        </header>
        {sites.length ? <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sites.map(site => (
            <SiteCard key={site.name} refresh={refresh} site={site} />
          ))}
        </ul> : <p>No sites found! <a href="#create-site">Add a new site</a> to get started.</p>}
        <Loader isVisible={loading} />
      </div>
    </Page>
  );
};

export default Sites;
