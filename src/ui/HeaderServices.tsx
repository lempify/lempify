/** External dependencies */
import { useEffect, useState } from 'react';
/** Internal dependencies */
import HeaderServicesItem from './HeaderServicesItem';
import { useLempifyd } from '../context/LempifydContext';
import SvgTriangle from './Svg/SvgTriangle';

const HeaderServices = () => {
  const [isOpen, setIsOpen] = useState(false);

  const { emit, state } = useLempifyd();

  useEffect(() => {
    async function giddyUp() {
      emit('php', 'is_running');
      emit('nginx', 'is_running');
      emit('mysql', 'is_running');
    }
    giddyUp();
  }, []);

  return (
    <>
      <span className='text-neutral-700 dark:text-neutral-300 text-sm'>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className='flex items-center'
        >
          {state.isAllServicesRunning
            ? 'All Services Running'
            : `${state.servicesCount - state.runningServicesCount} ${state.runningServicesCount === 1 ? 'Services' : 'Service'} Down`}{' '}
          <span
            className={`${state.isAllServicesRunning ? 'text-[var(--lempify-green)]' : 'text-[var(--lempify-red)]'}`}
          >
            <SvgTriangle
              size={16}
              className={`transition-transform duration-200 ease-in-out ${isOpen ? 'rotate-180' : ''}`}
            />
          </span>
        </button>
      </span>
      <div
        className={`overflow-hidden absolute top-[calc(100%+1px)] right-0`}
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
