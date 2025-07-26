import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

import Resizable from './Resizable';
import SvgChevron from './Svg/SvgChevron';
import PanelSiteCreate from './PanelSiteCreate';
import { SvgCog, SvgDashboard, SvgPlus, SvgSites } from './Svg';

import { useAppConfig } from '../context/AppConfigContext';

import { getPreferences, setPreferences } from '../utils/storage';
import Dialog from './Dialog';

const STANDARD_CSS = `
  rounded-md 
  flex 
  items-center 
  gap-2 
  overflow-hidden
  
  p-2 

  text-neutral-800 
  dark:text-neutral-200
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
  const preferences = getPreferences();
  // TODO: update when/if more dropdowns are added.
  const [isExpanded, setIsExpanded] = useState(
    preferences.isSiteDropdownOpen ?? false
  );
  const [isSiteCreateOpen, setIsSiteCreateOpen] = useState(false);
  // get the current path
  const location = useLocation();
  const isActive = (to: string) =>
    location.pathname === to ||
    (location.pathname.startsWith(to) && to === '/sites');

  useEffect(() => {
    setPreferences({
      ...getPreferences(),
      isSiteDropdownOpen: isExpanded,
    });
  }, [isExpanded]);

  return (
    <>
      <Resizable>
        <aside className='@container/sidebar grid grid-rows-[1fr_auto] sticky top-0 h-full bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-white overflow-x-auto'>
          <nav className='flex flex-col p-2 text-sm overflow-y-auto'>
            <ul>
              {LINKS.map(link => (
                <li key={link.to} className='mb-2 last:mb-0'>
                  <div className='flex items-center'>
                    <NavLink
                      to={link.to}
                      className={({ isActive }) =>
                        `@sidebar-min:flex-1 ${STANDARD_CSS} ${isActive ? `${ACTIVE_CSS}` : INACTIVE_CSS}`
                      }
                    >
                      <i className='flex-shrink-0'>{link.icon}</i>
                      <span className='flex-1 @max-sidebar-min:hidden'>
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
                        className={`${isActive(link.to) ? 'bg-white dark:bg-black' : ''} rounded-md p-3 ml-2 flex-shrink-0 text-neutral-500 dark:text-neutral-400 @max-sidebar-min:hidden`}
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
                    <ul className='mx-2 text-sm mt-2 @max-sidebar-min:hidden'>
                      {config.sites.map(site => (
                        <li
                          key={site.name}
                          className='border-b border-neutral-300 dark:border-neutral-700'
                        >
                          <NavLink
                            to={`/sites/${site.domain}`}
                            className={({ isActive }) =>
                              `p-2 block truncate group hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-950 ${isActive ? `bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100` : 'text-neutral-600 dark:text-neutral-400'}`
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
          <div className='flex items-end justify-center'>
            <button
              className='opacity-80 p-5 transition-opacity hover:opacity-100 rounded-full bg-white dark:bg-black p-2 text-sm mb-[10%]'
              onClick={() => setIsSiteCreateOpen(true)}
            >
              <SvgPlus size={20} />
            </button>
          </div>
        </aside>
      </Resizable>
      <Dialog
        className='lempify-dialog'
        open={isSiteCreateOpen}
        onClose={() => setIsSiteCreateOpen(false)}
      >
        <PanelSiteCreate />
      </Dialog>
    </>
  );
}
