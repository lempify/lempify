import { Fragment } from 'react';
import { NavLink } from 'react-router-dom';

import { SvgCog, SvgDashboard, SvgPlus, SvgSites } from './Svg';

import { useAppConfig } from '../context/AppConfigContext';

const HOVER_CSS = `
  hover:bg-neutral-200 
  dark:hover:bg-neutral-800
`;

const STANDARD_CSS = `
  rounded-md 
  flex 
  items-center 
  gap-2 
  overflow-hidden
  
  p-2 
  mb-2 
  last:mb-0

  text-neutral-800 
  dark:text-neutral-200
  
  ${HOVER_CSS}
  `;

const INACTIVE_CSS = `
  bg-transparent 
  `;
const ACTIVE_CSS = `
  bg-white 
  dark:bg-black
  
  hover:bg-white 
  dark:hover:bg-black
  
  text-neutral-900 
  dark:text-neutral-100
  
  [&>i]:text-[var(--lempify-primary)]
  [&>i]:animate-slide-out-in
  `;

const LINKS = [
  {
    to: '/',
    label: 'Dashboard',
    icon: <SvgDashboard />,
  },
  {
    to: '/sites',
    label: 'Sites',
    icon: <SvgSites />,
  },
  {
    to: '/settings',
    label: 'Settings',
    icon: <SvgCog />,
  },
];

export default function Sidebar() {
  const { config } = useAppConfig();
  return (
    <aside className='sticky top-0 z-1 h-full bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-white border-r border-neutral-300 dark:border-neutral-700'>
      <nav className='flex flex-col p-2 text-sm'>
        {LINKS.map(link => (
          <Fragment key={link.to}>
            <NavLink
              data-active={true}
              to={link.to}
              className={({ isActive }) =>
                `${STANDARD_CSS} ${isActive ? `${ACTIVE_CSS}` : INACTIVE_CSS}`
              }
            >
              <i className='flex-shrink-0'>{link.icon}</i>
              <span className='flex-1'>
                {link.label}
                {link.label === 'Sites' && config.sites.length ? (
                  <sup className='text-neutral-500 dark:text-neutral-400'>
                    {` (${config.sites.length})`}
                  </sup>
                ) : (
                  ''
                )}
              </span>
            </NavLink>
            {link.label === 'Sites' && (
              <ul className='mx-2 text-sm'>
                {config.sites.map(site => (
                  <li
                    key={site.name}
                    className='border-b border-neutral-300 dark:border-neutral-700'
                  >
                    <NavLink
                      to={`/sites/${site.domain}`}
                      className={({ isActive }) =>
                        `p-2 block truncate group ${isActive ? `text-neutral-900 dark:text-neutral-100` : 'text-neutral-700 dark:text-neutral-300'}`
                      }
                    >
                      <span className='hidden group-hover:block absolute'>{site.name}</span>
                      <span className='group-hover:invisible'>{site.name}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            )}
          </Fragment>
        ))}
      </nav>
      <button className='opacity-50 p-5 transition-opacity hover:opacity-100 rounded-md bg-white dark:bg-black absolute bottom-[10%] left-[50%] translate-x-[-50%] p-2 text-sm'>
        <SvgPlus size={46} />
      </button>
    </aside>
  );
}
