/** External dependencies */
import { useEffect, useRef, useState } from 'react';
/** Internal dependencies */
import HeaderServicesItem from './HeaderServicesItem';
import { useLempifyd } from '../context/LempifydContext';
import SvgTriangle from './Svg/SvgTriangle';
import { SvgSpinner } from './Svg';

const HeaderServices = () => {
  const [isOpen, setIsOpen] = useState(false);
  const servicesRef = useRef<HTMLDivElement>(null);
  const { emit, state, isActionPending } = useLempifyd();

  useEffect(() => {
    async function emitServices() {
      emit('php', 'is_running');
      emit('nginx', 'is_running');
      emit('mysql', 'is_running');
    }
    emitServices();

    function handleClickOutside(event: MouseEvent) {
      if (
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

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className='flex items-center text-neutral-700 dark:text-neutral-300 text-sm'
      >
        {isActionPending ? (
          <SvgSpinner size={16} />
        ) : (
          <>
            {state.isAllServicesRunning
              ? !isOpen
                ? ''
                : 'All Services Running'
              : !isOpen
                ? `(${state.servicesCount - state.runningServicesCount})`
                : `${state.servicesCount - state.runningServicesCount} ${state.runningServicesCount === 1 ? 'Services' : 'Service'} Down`}{' '}
            <span
              className={`${state.isAllServicesRunning ? 'text-[var(--lempify-green)]' : 'text-[var(--lempify-red)]'}`}
            >
              <SvgTriangle
                size={16}
                className={`transition-transform duration-200 ease-in-out ${isOpen ? 'rotate-180' : ''}`}
              />
            </span>
          </>
        )}
      </button>
      <div
        className={`overflow-hidden absolute top-[calc(100%+1px)] right-0${isOpen ? '' : ' pointer-events-none'}`}
        ref={servicesRef}
      >
        <ul
          className={`grid grid-cols-3 bg-neutral-100 dark:bg-neutral-900 border-b border-l border-neutral-300 dark:border-neutral-700 divide-x-1 divide-neutral-200 dark:divide-neutral-700 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-y-0' : '-translate-y-[calc(100%+1px)]'}`}
        >
          {state.services &&
            Object.entries(state.services).map(([serviceKey, service]) => (
              <HeaderServicesItem
                key={serviceKey}
                service={service}
                emit={emit}
              />
            ))}
        </ul>
      </div>
    </>
  );
};

export default HeaderServices;
