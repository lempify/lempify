/** External dependencies */
import { useEffect, useRef, useState } from 'react';
import { invoke as tauriInvoke } from '@tauri-apps/api/core';
/** Internal dependencies */
import DependenciesItem from './DependenciesItem';
import PhpServicesGroup from './PhpServicesGroup';
import { useLempifyd } from '../context/LempifydContext';
import { useAppConfig } from '../context/AppConfigContext';
import SvgTriangle from './Svg/SvgTriangle';
import { SvgSpinner } from './Svg';
import { useNavigate } from 'react-router-dom';
import Button from './Button';
import { DEFAULT_PHP_VERSION } from '../constants';

const HeaderServices = () => {
  const [isOpen, setIsOpen] = useState(false);
  const servicesRef = useRef<HTMLDivElement>(null);
  const { emit, state, isActionPending } = useLempifyd();
  const { config } = useAppConfig();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();

  // On mount: emit all installed PHP versions + nginx + mysql together
  useEffect(() => {
    emit('nginx', 'is_running');
    emit('mysql', 'is_running');

    tauriInvoke<string[]>('get_installed_php_versions')
      .then(versions => {
        const toCheck = versions.length > 0 ? versions : [DEFAULT_PHP_VERSION];
        toCheck.forEach(v => emit(`php@${v}`, 'is_running'));
      })
      .catch(() => emit(`php@${DEFAULT_PHP_VERSION}`, 'is_running'));

    function handleClickOutside(event: MouseEvent) {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node) &&
        servicesRef.current &&
        !servicesRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Re-emit when sites change to pick up any new PHP versions added via site creation
  useEffect(() => {
    const versions = [...new Set(config.sites.map(site => site.services.php))];
    versions.forEach(version => emit(`php@${version}`, 'is_running'));
  }, [config.sites]);

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className='flex items-center text-neutral-700 dark:text-neutral-300 text-sm'
        ref={buttonRef}
      >
        {isActionPending ? (
          <SvgSpinner size={16} />
        ) : (
          <>
            <span className={`hidden md:block ${isOpen ? 'visible' : 'invisible'}`}>
              {state.isServicesValid ? (
                'All Services Running'
              ) : (
                <>
                  {state.servicesCount - state.runningServicesCount}{' '}
                  {state.runningServicesCount === 1 ? 'Services' : 'Service'}{' '}
                  Down
                </>
              )}
            </span>

            <span
              className={`${state.isServicesValid ? 'text-[var(--lempify-green)]' : 'text-[var(--lempify-red)]'}`}
            >
              <SvgTriangle
                size={16}
                direction='up'
                className={`motion-safe:transition-transform motion-safe:duration-200 ease-in-out ${isOpen ? 'rotate-180' : ''}`}
              />
            </span>
          </>
        )}
      </button>
      <div
        className={`overflow-hidden absolute top-[calc(100%+1px)] right-0${isOpen ? '' : ' pointer-events-none'}`}
        ref={servicesRef}
      >
        <div
          className={`bg-neutral-100 dark:bg-neutral-900 border-b border-l border-neutral-300 dark:border-neutral-700 text-right motion-safe:transition-transform motion-safe:duration-300 ease-in-out ${isOpen ? 'translate-y-0' : '-translate-y-[calc(100%+1px)]'}`}
        >
          <ul
            className={`grid grid-cols-1 md:grid-cols-3 bg-neutral-100 dark:bg-neutral-900 divide-y-1 md:divide-y-0 divide-x-0 md:divide-x-1 divide-neutral-300 dark:divide-neutral-700`}
          >
            {(() => {
              const phpServices = state.requiredServices.filter(s =>
                s.name.startsWith('php@')
              );
              const otherServices = state.requiredServices.filter(
                s => !s.name.startsWith('php@')
              );
              return (
                <>
                  {phpServices.length > 0 && (
                    <PhpServicesGroup
                      services={phpServices}
                      emit={emit}
                      className='p-4 relative'
                    />
                  )}
                  {otherServices.map(dependency => (
                    <DependenciesItem
                      key={dependency.name}
                      dependency={dependency}
                      className='p-4 relative'
                      emit={emit}
                    />
                  ))}
                </>
              );
            })()}
          </ul>
          <div className='bg-neutral-100 dark:bg-neutral-900 text-right p-1'>
            <Button
              size='xs'
              onClick={() => navigate('/dependencies')}
              className={`text-neutral-600 dark:text-neutral-400 text-xs`}
            >
              View All
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default HeaderServices;
