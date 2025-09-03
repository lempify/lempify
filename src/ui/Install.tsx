import { useEffect, useState } from 'react';

import { useAppConfig } from '../context/AppConfigContext';
import { useLempifyd } from '../context/LempifydContext';
import { SERVICES, TOOLS } from '../constants';
import {
  NavLink,
  Route,
  BrowserRouter as Router,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import InstallDependencies from './InstallDependencies';
import Background from './Background';
import Brand from './Brand';
import InstallWelcome from './InstallWelcome';
import { buttonPrimary, cornerTopRight } from './css';
import InstallTrust from './InstallTrust';
import { useA11y } from '../context/A11yContext';
import Button from './Button';
import { useInvoke } from '../hooks/useInvoke';
import LoaderCircles from './LoaderCircles';

const NAV_LINK_DOT_CLASS = 'before:content-["•"] before:mr-2';
const NAV_LINK_CLASS = `${NAV_LINK_DOT_CLASS} p-2 text-neutral-600 dark:text-neutral-400 opacity-60 motion-safe:transition-font-size motion-safe:duration-300`;
const NAV_LINK_ACTIVE_CLASS =
  'text-md before:text-[var(--lempify-primary)] opacity-100';
const NAV_LINK_INACTIVE_CLASS = 'text-sm before:text-neutral-500';

const STEPS = [
  { slug: 'welcome', path: '/' },
  { slug: 'services', path: '/install/services' },
  { slug: 'tools', path: '/install/tools' },
  { slug: 'trust', path: '/install/trust' },
] as const;

function NavigationButtons({ currentStep }: { currentStep: number }) {
  const navigate = useNavigate();
  const { dispatch } = useAppConfig();
  const { invoke } = useInvoke();
  const prevPath = currentStep > 0 ? STEPS[currentStep - 1].path : '';
  const nextPath =
    currentStep < STEPS.length - 1 ? STEPS[currentStep + 1].path : '';

  return (
    <div className='text-right'>
      <Button
        disabled={prevPath === ''}
        className={`text-sm ${buttonPrimary}`}
        onClick={() => navigate(prevPath)}
      >
        {'<'}
      </Button>
      <Button
        disabled={nextPath === ''}
        className={`text-sm ${buttonPrimary}`}
        onClick={() => navigate(nextPath)}
      >
        {'>'}
      </Button>
      {nextPath === '' && (
        <Button
          className={`text-sm ${buttonPrimary}`}
          onClick={async () => {
            navigate('/');
            await invoke('set_installed');
            dispatch({ type: 'set_installed', installed: true });
          }}
        >
          Finish
        </Button>
      )}
    </div>
  );
}

export default function Install({ children }: { children: React.ReactNode }) {
  const { config, dispatch } = useAppConfig();
  const { invoke, invokeStatus } = useInvoke();
  const { emit, state } = useLempifyd();
  const { prefersReducedMotion } = useA11y();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();
  const [isInstalled, setIsInstalled] = useState(false);

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

  // Sync currentStep with URL
  useEffect(() => {
    const step = STEPS.findIndex(step => step.path === location.pathname);
    if (step > -1) {
      setCurrentStep(step);
    }
  }, [location]);

  if (config.installed === null) {
    return (
      <div className='bg-neutral-100 dark:bg-neutral-900 w-screen h-screen flex items-center justify-center flex-col bg-neutral-100 overflow-y-auto'>
        <div className='text-neutral-600 dark:text-white text-2xl font-bold'>
          <LoaderCircles isVisible={true} size={200} count={5} />
        </div>
      </div>
    );
  }

  if (config.installed || isInstalled) {
    return children;
  }

  return (
    <div className='bg-neutral-100 dark:bg-neutral-900 w-screen h-screen flex items-center justify-center flex-col bg-neutral-100 overflow-y-auto'>
      {!prefersReducedMotion && <Background />}
      <div
        className={`relative w-[calc(100vw-4rem)] h-[calc(100vh-4rem)] lg:w-2/3 lg:h-[60vh] lg:min-h-[60vh] ${cornerTopRight} grid grid-cols-[200px_1fr] border border-neutral-300 dark:border-neutral-700`}
      >
        <aside className='bg-white/40 dark:bg-black/40 text-neutral-600 dark:text-white p-4 grid grid-rows-[1fr_auto] border-r border-neutral-300 dark:border-neutral-700 backdrop-blur-[1px]'>
          <ul className='my-5'>
            <li className='mb-4'>
              <NavLink
                className={({ isActive }) =>
                  `${NAV_LINK_CLASS} ${isActive ? NAV_LINK_ACTIVE_CLASS : NAV_LINK_INACTIVE_CLASS}`
                }
                to='/'
              >
                Welcome
              </NavLink>
            </li>
            <li className='mb-4'>
              <NavLink
                className={({ isActive }) =>
                  `${NAV_LINK_CLASS} ${isActive ? NAV_LINK_ACTIVE_CLASS : NAV_LINK_INACTIVE_CLASS}`
                }
                to='/install/services'
              >
                Install Services
              </NavLink>
            </li>
            <li className='mb-4'>
              <NavLink
                className={({ isActive }) =>
                  `${NAV_LINK_CLASS} ${isActive ? NAV_LINK_ACTIVE_CLASS : NAV_LINK_INACTIVE_CLASS}`
                }
                to='/install/tools'
              >
                Install Tools
              </NavLink>
            </li>
            <li>
              <NavLink
                className={({ isActive }) =>
                  `${NAV_LINK_CLASS} ${isActive ? NAV_LINK_ACTIVE_CLASS : NAV_LINK_INACTIVE_CLASS}`
                }
                to='/install/trust'
              >
                Trust
              </NavLink>
            </li>
          </ul>
          <Brand />
        </aside>
        <div className='flex flex-col bg-neutral-100/60 dark:bg-neutral-900/60 backdrop-blur-[1px] min-h-0 overflow-x-hidden'>
          <div className='p-4 overflow-y-auto flex-1 min-h-0'>
            <Routes>
              <Route path='/' element={<InstallWelcome />} />
              <Route
                path='/install/services'
                element={
                  <InstallDependencies
                    title='Install Services'
                    dependencies={{ ...SERVICES, ...state.services }}
                  />
                }
              />
              <Route
                path='/install/tools'
                element={
                  <InstallDependencies
                    title='Install Tools'
                    dependencies={{ ...TOOLS, ...state.tools }}
                  />
                }
              />
              <Route path='/install/trust' element={<InstallTrust />} />
            </Routes>
          </div>
          <div className='p-4 border-t border-neutral-300 dark:border-neutral-700'>
            <NavigationButtons currentStep={currentStep} />
          </div>
        </div>
      </div>
      <Button
        className='absolute bottom-2 right-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 text-xs'
        onClick={() => {
          invoke('set_installed').then(() => {
            dispatch({ type: 'set_installed', installed: true });
            navigate('/', { replace: true });
          });
        }}
      >
        {invokeStatus === 'pending' ? 'Skipping Install...' : 'Skip Install >'}
      </Button>
    </div>
  );
}
