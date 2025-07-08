import { useParams } from 'react-router-dom';
import { useAppConfig } from '../context/AppConfigContext';
import Page from './Page';
import { openInBrowser } from '../utils/tauri';
import Anchor from './Anchor';

export default function Site() {
  const { domain } = useParams();
  const { config } = useAppConfig();

  const site = config.sites.find(site => site.domain === domain);

  if (!site) {
    return null;
  }

  return (
    <Page
      title={site.domain}
      description={() => (
        <>
          <Anchor
            onClick={() => openInBrowser(site.domain, site.ssl)}
            className='text-sm hover:underline'
          >
            View in browser
          </Anchor>
        </>
      )}
    >
      <div className='flex flex-col gap-4'>
        <h1>{site.domain}</h1>
        <pre>{JSON.stringify({ site }, null, 2)}</pre>
      </div>
    </Page>
  );
}
