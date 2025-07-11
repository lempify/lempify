import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

import { SvgCog, SvgDashboard, SvgPlus, SvgSites } from './Svg';

import { useAppConfig } from '../context/AppConfigContext';
import SvgChevron from './Svg/SvgChevron';

const HOVER_CSS = `
  
`;

const STANDARD_CSS = `
  rounded-md 
  flex 
  items-center 
  gap-2 
  overflow-hidden
  
  p-2 

  text-neutral-800 
  dark:text-neutral-200
  
  ${HOVER_CSS}
  `;

const INACTIVE_CSS = `
  bg-transparent 
  hover:bg-neutral-200 
  dark:hover:bg-neutral-800
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
  // TODO: update when/if more dropdowns are added.
  const [isExpanded, setIsExpanded] = useState(false);
  // get the current path
  const location = useLocation();
  const isActive = (to: string) =>
    location.pathname === to ||
    (location.pathname.startsWith(to) && to === '/sites');

  return (
    <aside className='sticky top-0 z-1 h-full bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-white border-r border-neutral-300 dark:border-neutral-700'>
      <nav className='flex flex-col p-2 text-sm'>
        <ul>
          {LINKS.map(link => (
            <li key={link.to} className='mb-2 last:mb-0'>
              <div className='flex items-center'>
                <NavLink
                  to={link.to}
                  className={({ isActive }) =>
                    `flex-1 ${STANDARD_CSS} ${isActive ? `${ACTIVE_CSS}` : INACTIVE_CSS}`
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
                  <button
                    className={`${isActive(link.to) ? 'bg-white dark:bg-black' : ''} rounded-md p-3 ml-2 flex-shrink-0 text-neutral-500 dark:text-neutral-400`}
                    onClick={() => setIsExpanded(!isExpanded)}
                  >
                    {isExpanded ? (
                      <SvgChevron direction='up' size={16} />
                    ) : (
                      <SvgChevron direction='down' size={16} />
                    )}
                  </button>
                )}
              </div>
              {link.label === 'Sites' && isExpanded && (
                <ul className='mx-2 text-sm mt-2'>
                  {config.sites.map(site => (
                    <li
                      key={site.name}
                      className='border-b border-neutral-300 dark:border-neutral-700'
                    >
                      <NavLink
                        to={`/sites/${site.domain}`}
                        className={({ isActive }) =>
                          `p-2 block truncate group hover:text-neutral-900 dark:hover:text-neutral-100 ${isActive ? `text-neutral-900 dark:text-neutral-100` : 'text-neutral-600 dark:text-neutral-400'}`
                        }
                      >
                        {/* Active */}
                        <span className='hidden group-hover:block absolute'>
                          {site.name}
                        </span>
                        <span className='group-hover:invisible'>
                          {site.name}
                        </span>
                      </NavLink>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </nav>
      <button className='opacity-50 p-5 transition-opacity hover:opacity-100 rounded-md bg-white dark:bg-black absolute bottom-[10%] left-[50%] translate-x-[-50%] p-2 text-sm'>
        <SvgPlus size={46} />
      </button>
    </aside>
  );
}
