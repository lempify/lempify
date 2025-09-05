import { useLocation, useParams } from 'react-router-dom';

import { useAppConfig } from '../context/AppConfigContext';

import Page from './Page';

import { parseSiteUrl } from '../utils/parse';

export default function Site() {
  const { domain } = useParams();
  const location = useLocation();
  const { config } = useAppConfig();

  const site = config.sites.find(site => site.domain === domain);

  if (!site) {
    return null;
  }

  const siteFields = Object.entries(site);

  return (
    <Page
      title={site.name}
      description={() => (
        <a
          href={parseSiteUrl(site.domain, site.ssl)}
          target='_blank'
          rel='noopener noreferrer'
          className='text-sm hover:underline'
        >
          {site.domain}
        </a>
      )}
    >
      <ul>
        {siteFields.map(([key, value]) => (
          <li key={key}>
            {typeof value === 'object' ? (
              <>
                {key}: <pre>{JSON.stringify(value, null, 2)}</pre>
              </>
            ) : (
              <>
                {key}: {value}
              </>
            )}
          </li>
        ))}
      </ul>
      {/* <div className='flex flex-col gap-4'>
        <h1>{site.domain}</h1>
        <p>{location.pathname}</p>
        <pre>{JSON.stringify({ domain, site, location }, null, 2)}</pre>
      </div> */}
    </Page>
  );
}
