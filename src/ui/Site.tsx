import { useEffect, useState } from 'react';
import { ask } from '@tauri-apps/plugin-dialog';
import { openPath } from '@tauri-apps/plugin-opener';
import { useNavigate, useParams } from 'react-router-dom';

import { useAppConfig } from '../context/AppConfigContext';
import { parseSiteUrl } from '../utils/parse';
import { PingData } from '../types/site';
import { useInvoke } from '../hooks/useInvoke';

import Page from './Page';
import Anchor from './Anchor';
import Button from './Button';
import Loader from './Loader';
import Heading from './Heading';
import { cornerBottomLeft, cornerTopRight, pageSection } from './css';
import { SvgLock, SvgMysql, SvgNginx, SvgPhp } from './Svg';
import { openInBrowser } from '../utils/tauri';

const LAST_PING_INTERVAL = 60000;
const PING_REFRESH_INTERVAL = 30000;
const MAX_PING_HISTORY = 24;

function timeAgo(ms: number): string {
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function Badge({
  children,
  icon,
  variant = 'default',
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
  variant?: 'default' | 'success';
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${
        variant === 'success'
          ? 'border-green-300 dark:border-green-800 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/60'
          : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400'
      }`}
    >
      {icon}
      {children}
    </span>
  );
}

function PathRow({ label, value }: { label: string; value: string }) {
  return (
    <div className='flex min-w-0 flex-col gap-2 py-3 border-b border-neutral-100 dark:border-neutral-800 last:border-0 md:flex-row md:items-start md:gap-4'>
      <div className='text-xs text-neutral-500 dark:text-neutral-400 flex-shrink-0 md:w-32 md:pt-0.5'>
        {label}
      </div>
      <div className='min-w-0 w-full flex-1 truncate text-sm font-mono text-neutral-700 dark:text-neutral-300'>
        {value}
      </div>
      <div className='flex-shrink-0'>
        <Button
          size='xs'
          isRounded
          variant='secondary'
          onClick={() => openPath(value)}
        >
          Open
        </Button>
      </div>
    </div>
  );
}

export default function Site() {
  const { invoke } = useInvoke();
  const { dispatch } = useAppConfig();
  const [pingData, setPingData] = useState<PingData | null>(null);
  const [pingHistory, setPingHistory] = useState<PingData[]>([]);
  const params = useParams();
  const { config } = useAppConfig();
  const navigate = useNavigate();
  const [invokedAction, setInvokedAction] = useState<string | null>(null);

  const site = config.sites.find(s => s.domain === params.domain);

  useEffect(() => {
    if (!site) return;

    setPingData(null);
    setPingHistory([]);

    const { domain, ping: lastPing } = site;
    const timeNow = Date.now();

    async function doPing() {
      setInvokedAction('ping_site');
      const { data } = await invoke<PingData>('ping_site', { domain });
      if (data) {
        setPingData(data);
        setPingHistory(prev => [...prev.slice(-(MAX_PING_HISTORY - 1)), data]);
        dispatch({ type: 'update_site', site: { ...site, ping: data } });
      }
      setInvokedAction(null);
    }

    if (!lastPing || timeNow - lastPing.timestamp > LAST_PING_INTERVAL) {
      doPing();
    } else {
      setPingData(lastPing);
      setPingHistory([lastPing]);
    }

    const interval = setInterval(doPing, PING_REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [site?.domain]);

  if (!site) return null;

  const siteUrl = parseSiteUrl(site.domain, site.ssl);
  const isPinging = invokedAction === 'ping_site';
  const isOnline = pingData?.online ?? false;

  async function handleDeleteSite() {
    const answer = await ask('This action cannot be undone. Are you sure?', {
      title: 'Delete site',
      kind: 'error',
      okLabel: 'Delete',
      cancelLabel: 'Cancel',
    });
    if (!answer) return;
    try {
      setInvokedAction('delete_site');
      const { data } = await invoke('delete_site', {
        domain: site?.domain ?? '',
      });
      if (data) dispatch({ type: 'set_sites', sites: data });
    } catch {
    } finally {
      setInvokedAction(null);
      navigate('/sites', { replace: true });
    }
  }

  async function handleOpenCode() {
    try {
      setInvokedAction('open_code');
      await invoke<void>('open_code', { path: site?.site_config.root ?? '' });
    } catch (err) {
      console.error(err);
    } finally {
      setInvokedAction(null);
    }
  }

  const stackItems = [
    { label: 'PHP', value: site.services.php, Icon: SvgPhp },
    { label: 'MySQL', value: site.services.mysql, Icon: SvgMysql },
    { label: 'Nginx', value: site.services.nginx, Icon: SvgNginx },
  ];

  const emptySlots = Math.max(0, MAX_PING_HISTORY - pingHistory.length);

  return (
    <Page title={site.name || site.domain}>
      {/* Status */}
      <div className={`${pageSection} ${cornerTopRight} @container`}>
        <div className='flex flex-col flex-col-reverse @md:flex-row @md:items-start justify-between gap-6'>
          {/* Site information */}
          <div className='flex flex-col gap-3'>
            <div className='flex items-center gap-3'>
              <span
                className={`size-3 rounded-full flex-shrink-0 transition-colors ${
                  isPinging
                    ? 'bg-yellow-400 animate-pulse'
                    : isOnline
                      ? 'bg-green-500'
                      : pingData
                        ? 'bg-red-500'
                        : 'bg-neutral-400'
                }`}
              />
              <Anchor
                href={siteUrl}
                isExternal
                variant='arrow'
                className='text-neutral-700 dark:text-neutral-300'
              >
                {site.domain}
              </Anchor>
            </div>

            <div className='flex items-center gap-2 flex-wrap'>
              <Badge>{site.site_type}</Badge>
              {site.ssl && (
                <Badge icon={<SvgLock size={10} />} variant='success'>
                  SSL
                </Badge>
              )}
            </div>
          </div>
          {/* Site actions */}
          <div className='flex gap-2 flex-shrink-0 flex-wrap @md:flex-nowrap'>
            <Button
              size='sm'
              className='border border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 rounded hover:bg-blue-50 dark:hover:bg-blue-950/40'
              onClick={() => openInBrowser(site.domain, site.ssl)}
            >
              Site
            </Button>
            <Button
              size='sm'
              className='border border-green-300 dark:border-green-800 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/60 rounded hover:bg-green-50 dark:hover:bg-green-950/40'
              onClick={() => openInBrowser(`${site.domain}/wp-admin`, site.ssl)}
            >
              Admin
            </Button>
            <Button
              size='sm'
              className='border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 rounded hover:bg-red-50 dark:hover:bg-red-950/40'
              onClick={handleDeleteSite}
            >
              Delete
            </Button>
            <Button
              size='sm'
              className='border border-black dark:border-white/60 text-black dark:text-white rounded hover:bg-black/10 dark:hover:bg-white/10'
              onClick={handleOpenCode}
            >
              IDE
            </Button>
          </div>
        </div>

        {/* Status history */}
        <div className='mt-8'>
          <div className='flex items-center justify-between mb-2'>
            <p className='text-xs text-neutral-500 dark:text-neutral-400'>
              Status history
            </p>
            {pingData && (
              <p className='text-xs text-neutral-500 dark:text-neutral-400'>
                <span
                  className={
                    isOnline
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }
                >
                  {isOnline ? 'Online' : 'Offline'}
                </span>
                {' · '}
                {timeAgo(pingData.timestamp)}
              </p>
            )}
          </div>
          <div className='flex gap-1 h-8'>
            {/* Empty placeholder slots */}
            {Array.from({ length: emptySlots }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className='flex-1 rounded-sm bg-neutral-200 dark:bg-neutral-700'
              />
            ))}
            {/* Actual history */}
            {pingHistory.map((p, i) => (
              <div
                key={i}
                title={`${p.online ? 'Online' : 'Offline'} · ${timeAgo(p.timestamp)}`}
                className={`flex-1 rounded-sm transition-colors ${
                  p.online
                    ? 'bg-green-500 dark:bg-green-600'
                    : 'bg-red-500 dark:bg-red-600'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Stack */}
      <div className={`${pageSection} @container`}>
        <header className='mb-6'>
          <Heading size='h2' title='Stack' split />
        </header>
        <div className='grid grid-cols-1 @sm:grid-cols-2 @md:grid-cols-3 gap-4'>
          {stackItems.map(({ label, value, Icon }) => (
            <div
              key={label}
              className='flex items-center justify-center gap-4 border border-neutral-200 dark:border-neutral-700 rounded p-4 bg-white dark:bg-neutral-900/40'
            >
              <Icon
                size={32}
                className='text-neutral-300 dark:text-neutral-600 flex-shrink-0'
              />
              <div>
                <p className='text-xs text-neutral-500 dark:text-neutral-400'>
                  {label}
                </p>
                <p className='text-sm font-medium text-neutral-900 dark:text-neutral-100'>
                  {value}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Paths */}
      <div className={`${pageSection} ${cornerBottomLeft}`}>
        <header className='mb-4'>
          <Heading size='h2' title='Configuration' split />
        </header>
        <div>
          <PathRow label='Root' value={site.site_config.root} />
          <PathRow label='Logs' value={site.site_config.logs} />
          {site.site_config.ssl_cert && (
            <PathRow
              label='SSL Certificate'
              value={site.site_config.ssl_cert}
            />
          )}
          {site.site_config.ssl_key && (
            <PathRow label='SSL Key' value={site.site_config.ssl_key} />
          )}
        </div>
      </div>

      <Loader isVisible={invokedAction === 'delete_site'} />
    </Page>
  );
}
