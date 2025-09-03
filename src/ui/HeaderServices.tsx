/** External dependencies */
import { useEffect, useRef, useState } from 'react';
/** Internal dependencies */
import HeaderServicesItem from './DependenciesItem';
import { useLempifyd } from '../context/LempifydContext';
import SvgTriangle from './Svg/SvgTriangle';
import { SvgSpinner } from './Svg';
import { useNavigate } from 'react-router-dom';
import { buttonPrimaryXs } from './css';
import Button from './Button';

const HeaderServices = () => {
  const [isOpen, setIsOpen] = useState(false);
  const servicesRef = useRef<HTMLDivElement>(null);
  const { emit, state, isActionPending } = useLempifyd();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function emitServices() {
      emit('php', 'is_running');
      emit('nginx', 'is_running');
      emit('mysql', 'is_running');
    }
    emitServices();

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
            <span className={`${isOpen ? 'visible' : 'invisible'}`}>
              {state.isAllServicesRunning ? (
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
              className={`${state.isAllServicesRunning ? 'text-[var(--lempify-green)]' : 'text-[var(--lempify-red)]'}`}
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
        <ul
          className={`grid grid-cols-3 bg-neutral-100 dark:bg-neutral-900 border-b border-l border-neutral-300 dark:border-neutral-700 divide-x-1 divide-neutral-200 dark:divide-neutral-700 motion-safe:transition-transform motion-safe:duration-300 ease-in-out ${isOpen ? 'translate-y-0' : '-translate-y-[calc(100%+1px)]'}`}
        >
          {state.requiredServices &&
            state.requiredServices.map(service => (
              <HeaderServicesItem
                key={service.name}
                service={service}
                emit={emit}
              />
            ))}

          <li className='col-span-3 text-right mb-2 mr-2'>
            <Button
              size='xs'
              onClick={() => navigate('/dependencies')}
              className={`${buttonPrimaryXs} inline-flex`}
            >
              View All
            </Button>
          </li>
        </ul>
      </div>
    </>
  );
};

export default HeaderServices;
