import { useLocation, useParams } from 'react-router-dom';

import { useAppConfig } from '../context/AppConfigContext';

import Page from './Page';

import { parseSiteUrl } from '../utils/parse';
import Anchor from './Anchor';
import Button from './Button';

export default function Site() {
  const params = useParams();
  const location = useLocation();
  const { config } = useAppConfig();

  const site = config.sites.find(site => site.domain === params.domain);

  if (!site) {
    return null;
  }

  const siteFields = Object.entries(site);
  const siteUrl = parseSiteUrl(site.domain, site.ssl);

  return (
    <Page
      title={site.name}
      description={() => (
        <Anchor
          href={siteUrl}
          className='text-sm hover:underline'
          isExternal
          variant='arrow'
        >
          {site.domain}{' '}
          <Button onClick={() => {}}>Delete site</Button>
        </Anchor>
      )}
    >
      <ul className='grid grid-cols-2'>
        {siteFields.map(([key, value]) => (
          <li key={key} className='flex flex-col gap-2'>
            {typeof value === 'object' ? (
              <>
                <span className='text-sm text-neutral-500 dark:text-neutral-400'>
                  {key}:
                </span>{' '}
                <pre className='overflow-x-auto'>{JSON.stringify(value, null, 2)}</pre>
              </>
            ) : (
              <>
                <span className='text-sm text-neutral-500 dark:text-neutral-400'>
                  {key}:
                </span>{' '}
                {value}
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
