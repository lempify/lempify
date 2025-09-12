import { useEffect, useState } from 'react';
import { ask } from '@tauri-apps/plugin-dialog';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { useAppConfig } from '../context/AppConfigContext';

import { parseSiteUrl } from '../utils/parse';

import { useInvoke } from '../hooks/useInvoke';

import Page from './Page';
import Anchor from './Anchor';
import Button from './Button';
import Loader from './Loader';

export default function Site() {
  const { invoke, invokeStatus } = useInvoke();
  const { dispatch } = useAppConfig();
  const [online, setOnline] = useState(false);
  const params = useParams();
  const location = useLocation();
  const { config } = useAppConfig();
  const navigate = useNavigate();
  const [invokedAction, setInvokedAction] = useState<string | null>(null);

  const site = config.sites.find(site => site.domain === params.domain);

  useEffect(() => {
    if (!site) return;
    const {domain} = site;
    setInvokedAction('ping_site');
    async function pingSite() {
      const request = await fetch(`https://${domain}`);
      console.log({request});
      setOnline(request.ok);
      dispatch({
        type: 'update_site',
        site: { ...site, online: request.ok },
      });
    }
    // async function pingSite() {
    //   const { data } = await invoke<boolean>('ping_site', {
    //     // @ts-ignore
    //     domain: site.domain,
    //   });
    //   setOnline(data ?? false);
    //   dispatch({
    //     type: 'update_site',
    //     site: { ...site, online: data ?? false },
    //   });
    // }
    pingSite();
    // invoke<boolean>('ping_site', {
    //   domain: site.domain,
    // })
    //   .then(({ data }) => {
    //     setOnline(data ?? false);
    //     dispatch({
    //       type: 'update_site',
    //       site: { ...site, online: data ?? false },
    //     });
    //   })
    //   .finally(() => {
    //     setInvokedAction(null);
    //   });
  }, [site?.domain]);

  if (!site) {
    return null;
  }

  const siteFields = Object.entries(site);
  const siteUrl = parseSiteUrl(site.domain, site.ssl);

  const onlineIndicator = (
    <span
      className={`size-2 inline-flex rounded-full ${invokeStatus === 'pending' ? 'bg-yellow-500 animate-pulse' : online ? 'bg-green-500' : 'bg-red-500'}`}
    />
  );

  async function handleDeleteSite() {
    const answer = await ask('This action cannot be undone. Are you sure?', {
      title: 'Delete site',
      kind: 'error',
      okLabel: 'Delete',
      cancelLabel: 'Cancel',
    });
    if (!answer) {
      return;
    }
    try {
      setInvokedAction('delete_site');
      const { data } = await invoke('delete_site', {
        domain: site?.domain ?? '',
      });
      if (data) {
        dispatch({ type: 'set_sites', sites: data });
      }
      // success();
    } catch (err) {
      // error(err);
    } finally {
      setInvokedAction(null);
      navigate('/sites', { replace: true });
    }
  }

  return (
    <Page
      title={site.name}
      description={() => (
        <>
          {onlineIndicator}
          <Anchor
            href={siteUrl}
            className='text-sm hover:underline'
            isExternal
            variant='arrow'
          >
            {site.domain}
          </Anchor>{' '}
          <Button onClick={handleDeleteSite}>Delete site</Button>
        </>
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
                <pre className='overflow-x-auto'>
                  {JSON.stringify(value, null, 2)}
                </pre>
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
      <Loader isVisible={['delete_site'].includes(invokedAction ?? '')} />
    </Page>
  );
}
