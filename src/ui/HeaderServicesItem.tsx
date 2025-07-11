import { useState } from 'react';

import { Statuses, ServiceType } from '../types';

import Dialog from './Dialog';
import Button from './Button';
import Loader from './Loader';
import { SvgNginx, SvgMysql, SvgPhp } from './Svg';
import { ServiceStatus, useLempifyd } from '../context/LempifydContext';

const icons = {
  nginx: SvgNginx,
  mysql: SvgMysql,
  php: SvgPhp,
};

const ServicesStatusIcon = ({
  name,
  running,
}: {
  name: string;
  running: boolean;
  installed: boolean;
}) => {
  const Icon = icons[name as keyof typeof icons];
  return (
    <p className='flex items-center mb-2 gap-2 text-sm text-neutral-700 dark:text-neutral-300'>
      <span
        className={`size-2 rounded-full ${running ? 'bg-green-500' : 'bg-red-500'}`}
      />
      <span>{name}</span>
      <span className='ml-auto size-6 flex items-center justify-center'>
        <Icon />
      </span>
    </p>
  );
};

export default function HeaderServicesItem({
  service,
  emit,
}: {
  service: ServiceStatus;
  emit: (name: ServiceType, action: string) => Promise<void>;
}) {
  const [repairStatus, setStatuses] = useState<Statuses>('idle');
  const { dispatch } = useLempifyd();

  const handleRepair = () => {
    if (repairStatus === 'idle') {
      setStatuses('pending');
    }
  };

  const renderRepairLabel = () => {
    switch (repairStatus) {
      case 'pending':
        return 'Repairing...';
      case 'fixed':
        return 'Repaired!';
      case 'error':
        return 'Failed';
      case 'idle':
        return 'Repair';
      default:
        return 'Idle';
    }
  };

  function clearServiceError() {
    dispatch({
      type: 'SERVICE_ERROR',
      payload: {
        name: service.name,
        lastError: '',
      },
    });
  }

  const btnCss = `
    text-neutral-700 dark:text-neutral-300 
    bg-white hover:bg-neutral-100 dark:bg-neutral-800 dark:hover:bg-neutral-700
    border border-neutral-300 dark:border-neutral-600 dark:hover:border-neutral-600
    
    rounded-lg 
    
    text-xs 
    
    px-1 py-0.5 
  `;

  return (
    <li className='relative p-2'>
      <Dialog open={service.lastError !== ''} onClose={clearServiceError}>
        <div className='text-center w-full'>
          <div className='text-lg font-bold rounded-full bg-red-500 text-white p-2 text-center w-10 h-10 mx-auto'>
            !
          </div>
        </div>
        <p className='text-sm'>
          <strong>{service.name}:</strong> {service.lastError}
        </p>
      </Dialog>
      <ServicesStatusIcon
        name={service.name}
        running={service.is_running ?? false}
        installed={service.is_installed ?? false}
      />
      <div className='flex gap-[1px]'>
        {!service.is_installed ? (
          <Button
            className={btnCss}
            onClick={() => emit(service.name, 'install')}
          >
            Install
          </Button>
        ) : (
          <>
            {service.is_installed && !service.is_running && (
              <Button
                className={btnCss}
                onClick={() => emit(service.name, 'start')}
              >
                Start
              </Button>
            )}
            {service.is_running && (
              <Button
                className={btnCss}
                onClick={() => emit(service.name, 'stop')}
              >
                Stop
              </Button>
            )}
            <Button
              className={btnCss}
              onClick={handleRepair}
              disabled={repairStatus === 'pending'}
            >
              <span
                className={`w-2 h-2 rounded-full ${repairStatus === 'pending' ? 'bg-yellow-500' : repairStatus === 'fixed' ? 'bg-green-500' : 'bg-red-500'}`}
              />{' '}
              {renderRepairLabel()}
            </Button>
            <Button
              className={btnCss}
              onClick={() => emit(service.name, 'restart')}
            >
              Restart Service
            </Button>
          </>
        )}
        <Loader isVisible={service.pendingAction} size={20} />
      </div>
    </li>
  );
}
