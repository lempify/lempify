import { useState } from 'react';

import { Statuses } from '../types';

import Dialog from './Dialog';
import Button from './Button';
import Loader from './Loader';
import { SvgNginx, SvgMysql, SvgPhp, SvgComposer, SvgTool, SvgTriangle, SvgRedis, SvgMemcached, SvgWpCli, SvgMailpit } from './Svg';
import { Status, useLempifyd } from '../context/LempifydContext';
import { buttonPrimaryXs } from './css';
import SvgLink from './Svg/SvgLink';

const icons = {
  nginx: SvgNginx,
  mysql: SvgMysql,
  php: SvgPhp,
  composer: SvgComposer,
  redis: SvgRedis,
  memcached: SvgMemcached,
  'wp-cli': SvgWpCli,
  mailpit: SvgMailpit,
  defaultService: SvgTriangle,
  defaultTool: SvgTool,
};

const ServicesStatusIcon = ({
  name,
  url,
  running,
  humanName,
  type,
}: {
  name: string;
  url?: string;
  running: boolean;
  installed: boolean;
  humanName: string;
  type?: string;
}) => {
  const Icon = icons[name as keyof typeof icons] ?? (type === 'tool' ? icons.defaultTool : icons.defaultService);
  return (
    <p className='flex items-center mb-2 gap-2 text-sm text-neutral-700 dark:text-neutral-300'>
      <span
        className={`size-2 rounded-full ${running ? 'bg-green-500' : 'bg-red-500'}`}
      />
      <span>{humanName}</span>
      {url && <a href={url} target='_blank' rel='noopener noreferrer'>
        <SvgLink size={16} />
      </a>}
      <span className='ml-auto size-6 flex items-center justify-center'>
        <Icon direction='up' />
      </span>
    </p>
  );
};

export default function DependenciesItem({
  service,
  emit,
}: {
  service: Status;
  emit: (name: string, action: string) => Promise<void>;
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

  const isService = service.dependencyType === 'service';
  const isTool = service.dependencyType === 'tool';

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
        url={service.url}
        running={service.isRunning ?? false}
        installed={service.isInstalled ?? false}
        humanName={service.humanName}
        type={service.dependencyType}
      />
      
      <div className='flex gap-[1px]'>
        {!service.isInstalled ? (
          <Button
            className={buttonPrimaryXs}
            onClick={() => emit(service.name, 'install')}
          >
            Install
          </Button>
        ) : (
          isService && <>
            {service.isInstalled && !service.isRunning && (
              <Button
                className={buttonPrimaryXs}
                onClick={() => emit(service.name, 'start')}
              >
                Start
              </Button>
            )}
            {service.isRunning && (
              <Button
                className={buttonPrimaryXs}
                onClick={() => emit(service.name, 'stop')}
              >
                Stop
              </Button>
            )}
            <Button
              className={buttonPrimaryXs}
              onClick={handleRepair}
              disabled={repairStatus === 'pending'}
            >
              <span
                className={`w-2 h-2 rounded-full ${repairStatus === 'pending' ? 'bg-yellow-500' : repairStatus === 'fixed' ? 'bg-green-500' : 'bg-red-500'}`}
              />{' '}
              {renderRepairLabel()}
            </Button>
            <Button
              className={buttonPrimaryXs}
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
