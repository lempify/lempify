import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';

import { useAppConfig } from '../context/AppConfigContext';

import Dialog from './Dialog';
import Resizable from './Resizable';
import SvgChevron from './Svg/SvgChevron';
import DialogSiteCreate from './DialogSiteCreate';
import {
  SvgCog,
  SvgDashboard,
  SvgPlus,
  SvgSites,
  SvgDependencies,
} from './Svg';

import { getPreferences, setPreferences } from '../utils/storage';

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

  inset-shadow-2xs
  
  hover:bg-white 
  dark:hover:bg-black
  
  text-neutral-900 
  dark:text-neutral-100
  
  [&>i]:text-[var(--lempify-primary)]
  [&>i]:motion-safe:animate-slide-out-in
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
  {
    to: '/dependencies',
    label: 'Dependencies',
    icon: <SvgDependencies />,
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

  const navigate = useNavigate();

  useEffect(() => {
    setPreferences({
      ...getPreferences(),
      isSiteDropdownOpen: isExpanded,
    });
  }, [isExpanded]);

  return (
    <div className='row-span-2'>
      <div className='sticky top-[var(--lempify-header-height)] z-1 h-[calc(100vh-var(--lempify-header-height))]'>
        <Resizable
          tag='aside'
          className='@container/sidebar bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-white'
        >
          <div className='grid grid-rows-[1fr_auto] h-full'>
            <nav className='flex flex-col p-2 text-sm overflow-x-hidden'>
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
                        <span className='flex-1 @max-sidebar-min:hidden truncate'>
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
                            key={site.name || site.domain}
                            className='border-b border-neutral-300 dark:border-neutral-700'
                          >
                            <NavLink
                              to={`/sites/${site.domain}`}
                              className={({ isActive }) =>
                                `p-2 block truncate group hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-950 ${isActive ? `bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100` : 'text-neutral-600 dark:text-neutral-400'}`
                              }
                            >
                              {/* Active */}
                              <span className='hidden group-hover:block absolute bg-neutral-50 dark:bg-neutral-950'>
                                {site.domain}
                              </span>
                              <span className='group-hover:invisible'>
                                {site.domain}
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
            <div className='flex items-end justify-center overflow-x-hidden'>
              <button
                className='opacity-80 p-5 transition-opacity hover:opacity-100 rounded-full bg-white dark:bg-black p-2 text-sm mb-[10%]'
                onClick={() => setIsSiteCreateOpen(true)}
              >
                <SvgPlus size={20} />
              </button>
            </div>
          </div>
        </Resizable>
      </div>
      <Dialog
        open={isSiteCreateOpen}
        onClose={() => setIsSiteCreateOpen(false)}
      >
        <DialogSiteCreate
          onSubmit={domain => {
            setIsSiteCreateOpen(false);
            navigate(`/sites/${domain}`);
          }}
        />
      </Dialog>
    </div>
  );
}
