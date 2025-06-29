import Page from "./Page";
import Loader from './Loader';
import SiteCard from './SiteCard';
import SiteCreate from "./SitesCreate";
import SvgRefresh from './SvgRefresh';

import useSiteManager from "../hooks/useSiteManager";

import { cornerBottomLeft, pageSection } from "./css";
import { useAppConfig } from "../context/AppConfigContext";

const Sites = () => {
  const { loading, error, refresh } = useSiteManager();

  const { config } = useAppConfig();

  return (
    <Page title="Sites" description="Manage your sites">
      {error && <p className="text-red-500">Error: {error}</p>}
      <SiteCreate onRefresh={refresh} />
      <div className={`${pageSection} ${cornerBottomLeft}`}>
        <header className="flex items-center gap-2 mb-8">
          <h2 className="text-4xl text-[var(--lempify-primary)] to-[var(--lempify-primary-700)]">Existing Sites</h2>
          <button onClick={refresh} className="hover:rotate-270 transition-transform duration-300 ml-auto">
            <SvgRefresh />
          </button>
        </header>
        {config.sites.length ? <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {config.sites.map(site => (
            <SiteCard key={site.name} refresh={refresh} site={site} />
          ))}
        </ul> : <p>No sites found! <a href="#create-site">Add a new site</a> to get started.</p>}
        <Loader isVisible={loading} />
      </div>
    </Page>
  );
};

export default Sites;
