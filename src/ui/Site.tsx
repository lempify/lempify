import { useParams, Navigate } from "react-router-dom";
import useSiteManager from "../hooks/useSiteManager";
import { useAppConfig } from "../context/AppConfigContext";
import Page from "./Page";

export default function Site() {
  const { domain } = useParams();
  const { sites } = useSiteManager();
  const { config } = useAppConfig();

  const site = sites.find((site) => site.domain === domain);
  const siteConfig = config.sites.find((site) => site.domain === domain);

  // console.log("site", site);
  // console.log("siteConfig", siteConfig);

  if (!site) {
    return <Navigate to={`/site/404?domain=${domain}`} replace />;
  }

  return (
    <Page title={site.domain} description="Site editor">
      <div className="flex flex-col gap-4">
        <h1>{site.domain}</h1>
        <pre>{JSON.stringify({ site, siteConfig }, null, 2)}</pre>
      </div>
    </Page>
  );
}