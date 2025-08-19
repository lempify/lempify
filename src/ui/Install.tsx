import { useEffect } from 'react';

import { useAppConfig } from '../context/AppConfigContext';
import { useLempifyd } from '../context/LempifydContext';
import { SERVICES, TOOLS } from '../constants';
import {
  NavLink,
  Route,
  BrowserRouter as Router,
  Routes,
} from 'react-router-dom';
import InstallDependencies from './InstallDependencies';
import Background from './Background';
import Brand from './Brand';
import InstallWelcome from './InstallWelcome';
import { cornerTopRight } from './css';
import InstallTrust from './InstallTrust';
import { useA11y } from '../context/A11yContext';

const NAV_LINK_DOT_CLASS =
  'before:content-["•"] before:text-neutral-400 before:mr-2';
const NAV_LINK_CLASS = `${NAV_LINK_DOT_CLASS} p-2 block text-neutral-600 dark:text-neutral-400 opacity-60`;
const NAV_LINK_ACTIVE_CLASS = 'opacity-100';

export default function Install({ children }: { children: React.ReactNode }) {
  const { config } = useAppConfig();
  const { emit, state } = useLempifyd();
  const { prefersReducedMotion } = useA11y();

  useEffect(() => {
    async function emitServices() {
      // Services
      emit('php', 'is_running');
      emit('nginx', 'is_running');
      emit('mysql', 'is_running');
      // Optional services
      emit('redis', 'is_running');
      emit('memcached', 'is_running');
      // Tools
      emit('composer', 'is_running');
      emit('mkcert', 'is_running');
      // Optional tools
      emit('wp-cli', 'is_running');
      emit('mailpit', 'is_running');
    }
    emitServices();
  }, []);

  if (config.installed) {
    return children;
  }

  return (
    <div className='bg-neutral-100 dark:bg-neutral-900 w-screen h-screen flex items-center justify-center flex-col bg-neutral-100 overflow-y-auto'>
      {!prefersReducedMotion && <Background />}
      <div
        className={`relative w-[calc(100vw-4rem)] h-[calc(100vh-4rem)] lg:w-2/3 lg:h-[60vh] lg:min-h-[60vh] ${cornerTopRight} grid grid-cols-[200px_1fr] border border-neutral-300 dark:border-neutral-700`}
      >
        <Router>
          <aside className='bg-white/40 dark:bg-black/40 text-neutral-600 dark:text-white overflow-y-auto p-4 grid grid-rows-[1fr_auto] border-r border-neutral-300 dark:border-neutral-700 backdrop-blur-[1px]'>
            <Brand />
            <ul>
              <li className='mb-2'>
                <NavLink
                  className={({ isActive }) =>
                    `${NAV_LINK_CLASS} ${isActive ? NAV_LINK_ACTIVE_CLASS : ''}`
                  }
                  to='/'
                >
                  Welcome
                </NavLink>
              </li>
              <li className='mb-2'>
                <NavLink
                  className={({ isActive }) =>
                    `${NAV_LINK_CLASS} ${isActive ? NAV_LINK_ACTIVE_CLASS : ''}`
                  }
                  to='/install/services'
                >
                  Install Services
                </NavLink>
              </li>
              <li>
                <NavLink
                  className={({ isActive }) =>
                    `${NAV_LINK_CLASS} ${isActive ? NAV_LINK_ACTIVE_CLASS : ''}`
                  }
                  to='/install/tools'
                >
                  Install Tools
                </NavLink>
              </li>
              <li>
                <NavLink
                  className={({ isActive }) =>
                    `${NAV_LINK_CLASS} ${isActive ? NAV_LINK_ACTIVE_CLASS : ''}`
                  }
                  to='/install/trust'
                >
                  Trust
                </NavLink>
              </li>
            </ul>
          </aside>
          <div className='p-4 overflow-y-auto bg-neutral-100/60 dark:bg-neutral-900/60 backdrop-blur-[1px]'>
            <Routes>
              <Route path='/' element={<InstallWelcome />} />
              <Route
                path='/install/services'
                element={
                  <InstallDependencies
                    title='Services'
                    nextStepRoute='tools'
                    prevStepRoute=''
                    dependencies={{ ...SERVICES, ...state.services }}
                  />
                }
              />
              <Route
                path='/install/tools'
                element={
                  <InstallDependencies
                    title='Tools'
                    nextStepRoute='trust'
                    prevStepRoute='services'
                    dependencies={{ ...TOOLS, ...state.tools }}
                  />
                }
              />
              <Route path='/install/trust' element={<InstallTrust />} />
            </Routes>
          </div>
        </Router>
      </div>
      <button className='absolute bottom-2 right-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 text-xs'>
        Skip Install {'>'}
      </button>
    </div>
  );
}
