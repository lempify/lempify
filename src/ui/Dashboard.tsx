import { NavLink } from 'react-router-dom';

import Page from './Page';
import Heading from './Heading';
import { cornerBottomLeft, cornerTopRight, pageSection } from './css';
import { useAppConfig } from '../context/AppConfigContext';
import { Status, useLempifyd } from '../context/LempifydContext';

function StatCard({
  label,
  value,
  to,
  ok,
}: {
  label: string;
  value: string | number;
  to: string;
  ok?: boolean;
}) {
  return (
    <NavLink
      to={to}
      className='block border border-neutral-200 dark:border-neutral-700 rounded p-4 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors'
    >
      <p className='text-xs text-neutral-500 dark:text-neutral-400 mb-1'>
        {label}
      </p>
      <p className='text-2xl font-medium text-neutral-900 dark:text-neutral-100 flex items-center gap-2'>
        {value}
        {ok !== undefined && (
          <span
            className={`size-2 rounded-full ${ok ? 'bg-green-500' : 'bg-red-500'}`}
          />
        )}
      </p>
    </NavLink>
  );
}

function StatusRow({ item }: { item: Status }) {
  const isRunning = item.isRunning ?? false;
  const isInstalled = item.isInstalled ?? false;
  const active = item.dependencyType === 'tool' ? isInstalled : isRunning;
  return (
    <li className='flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300'>
      <span
        className={`size-2 flex-shrink-0 rounded-full ${active ? 'bg-green-500' : 'bg-red-500'}`}
      />
      {item.humanName}
    </li>
  );
}

export default function Dashboard() {
  const { config } = useAppConfig();
  const { state } = useLempifyd();

  const tools = Object.values(state.tools);
  const installedToolsCount = tools.filter(t => t.isInstalled).length;

  return (
    <Page title='Dashboard'>
      <div className={`${pageSection} ${cornerTopRight}`}>
        <header className='mb-6'>
          <Heading size='h2' title='Overview' split />
        </header>
        <div className='grid grid-cols-3 gap-4'>
          <StatCard
            label='Sites'
            value={config.sites.length}
            to='/sites'
          />
          <StatCard
            label='Services'
            value={`${state.runningServicesCount} / ${state.servicesCount}`}
            to='/dependencies'
            ok={state.isServicesValid}
          />
          <StatCard
            label='Tools'
            value={`${installedToolsCount} / ${tools.length}`}
            to='/dependencies'
            ok={state.isToolsValid}
          />
        </div>
      </div>

      <div className={`${pageSection}`}>
        <header className='mb-6'>
          <Heading size='h2' title='Services' split />
        </header>
        <ul className='grid grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-6'>
          {state.requiredServices.map(service => (
            <StatusRow key={service.name} item={service} />
          ))}
        </ul>
      </div>

      <div className={`${pageSection} ${cornerBottomLeft}`}>
        <header className='mb-6'>
          <Heading size='h2' title='Tools' split />
        </header>
        <ul className='grid grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-6'>
          {tools.map(tool => (
            <StatusRow key={tool.name} item={tool} />
          ))}
        </ul>
      </div>
    </Page>
  );
}
