import { useRef } from 'react';

import Page from './Page';
import Loader from './Loader';
import Heading from './Heading';
import SiteCard from './SiteCard';
import SiteCreate from './SitesCreate';

import useSiteManager from '../hooks/useSiteManager';
import { useAppConfig } from '../context/AppConfigContext';

import { cornerBottomLeft, cornerTopRight, pageSection } from './css';
import { Grid, GridItem } from './Grid';

const Sites = () => {
  const { loading, error, refresh } = useSiteManager();

  const { config } = useAppConfig();

  const createSiteRef = useRef<HTMLDivElement>(null);

  return (
    <Page title='Sites' description='Manage your sites'>
      {error && <p className='text-red-500'>Error: {error}</p>}
      <div ref={createSiteRef} className={`${pageSection} ${cornerTopRight}`}>
        <SiteCreate onRefresh={refresh} />
      </div>
      <div className={`${pageSection} ${cornerBottomLeft} @container`}>
        <header className='flex items-center gap-2 mb-8'>
          <Heading size='h2' title='Existing Sites' split />
        </header>
        {config.sites.length ? (
          <Grid childrenLength={config.sites.length}>
            {config.sites.map(site => (
              <GridItem
                key={site.name || site.domain}
              >
                <SiteCard refresh={refresh} site={site} />
              </GridItem>
            ))}
          </Grid>
        ) : (
          <p className='text-neutral-700 dark:text-neutral-300'>
            No sites found!{' '}
            <a
              className='cursor-pointer'
              onClick={() =>
                createSiteRef.current?.scrollIntoView({ behavior: 'smooth' })
              }
            >
              Add a new site
            </a>{' '}
            to get started.
          </p>
        )}
        <Loader isVisible={loading} />
      </div>
    </Page>
  );
};

export default Sites;
