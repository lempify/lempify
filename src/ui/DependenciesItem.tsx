import Dialog from './Dialog';
import Button from './Button';
import Loader from './Loader';
import {
  SvgNginx,
  SvgMysql,
  SvgPhp,
  SvgComposer,
  SvgTool,
  SvgTriangle,
  SvgRedis,
  SvgMemcached,
  SvgWpCli,
  SvgMailpit,
} from './Svg';
import { Status, useLempifyd } from '../context/LempifydContext';
import SvgLink from './Svg/SvgLink';
import { buttonWithArrow } from './css';

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

const BUTTON_CLASSNAME = `mr-4 ${buttonWithArrow}`;

function DependenciesHeader({
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
}) {
  const Icon =
    icons[name as keyof typeof icons] ??
    (type === 'tool' ? icons.defaultTool : icons.defaultService);
  return (
    <p className='flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300'>
      <span
        className={`size-2 rounded-full ${running ? 'bg-green-500' : 'bg-red-500'}`}
      />
      <span>{humanName}</span>
      {url && (
        <a href={url} target='_blank' rel='noopener noreferrer'>
          <SvgLink className='hover:text-black dark:hover:text-white' size={16} />
        </a>
      )}
      <span className='ml-auto size-6 flex items-center justify-center'>
        <Icon direction='up' />
      </span>
    </p>
  );
}

export default function DependenciesItem({
  dependency,
  emit,
  className = '',
}: {
  dependency: Status;
  emit: (name: string, action: string) => Promise<void>;
  className?: string;
}) {
  // const [repairStatus, setStatuses] = useState<Statuses>('idle');
  const { dispatch } = useLempifyd();

  // const handleRepair = () => {
  //   if (repairStatus === 'idle') {
  //     setStatuses('pending');
  //   }
  // };

  // const renderRepairLabel = () => {
  //   switch (repairStatus) {
  //     case 'pending':
  //       return 'Repairing...';
  //     case 'fixed':
  //       return 'Repaired!';
  //     case 'error':
  //       return 'Failed';
  //     case 'idle':
  //       return 'Repair';
  //     default:
  //       return 'Idle';
  //   }
  // };

  function clearServiceError() {
    dispatch({
      type: 'SERVICE_ERROR',
      payload: {
        name: dependency.name,
        lastError: '',
      },
    });
  }

  const isService = dependency.dependencyType === 'service';

  return (
    <div className={`min-h-full ${className}`}>
      <Dialog open={dependency.lastError !== ''} onClose={clearServiceError}>
        <div className='text-center w-full'>
          <div className='text-lg font-bold rounded-full bg-red-500 text-white p-2 text-center w-10 h-10 mx-auto'>
            !
          </div>
        </div>
        <p className='text-sm'>
          <strong>{dependency.name}:</strong> {dependency.lastError}
        </p>
      </Dialog>
      <DependenciesHeader
        name={dependency.name}
        url={dependency.url}
        running={dependency.isRunning ?? false}
        installed={dependency.isInstalled ?? false}
        humanName={dependency.humanName}
        type={dependency.dependencyType}
      />

      <ul className='flex flex-cols text-neutral-600 dark:text-neutral-400 text-xs mt-2 empty:mt-0'>
        {!dependency.isInstalled ? (
          <Button
            className={BUTTON_CLASSNAME}
            onClick={() => emit(dependency.name, 'install')}
          >
            Install
          </Button>
        ) : (
          isService && (
            <>
              {dependency.isInstalled && !dependency.isRunning && (
                <li>
                  <Button
                    className={BUTTON_CLASSNAME}
                    onClick={() => emit(dependency.name, 'start')}
                  >
                    Start
                  </Button>
                </li>
              )}
              {dependency.isRunning && (
                <li>
                  <Button
                    className={BUTTON_CLASSNAME}
                    onClick={() => emit(dependency.name, 'stop')}
                  >
                    Stop
                  </Button>
                </li>
              )}
              {/* <li>
                <Button
                  className={BUTTON_CLASSNAME}
                  onClick={handleRepair}
                  disabled={repairStatus === 'pending'}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${repairStatus === 'pending' ? 'bg-yellow-500' : repairStatus === 'fixed' ? 'bg-green-500' : 'bg-red-500'}`}
                  />
                  {renderRepairLabel()}
                </Button>
              </li> */}
              <li>
                <Button
                  className={BUTTON_CLASSNAME}
                  onClick={() => emit(dependency.name, 'restart')}
                >
                  Restart
                </Button>
              </li>
            </>
          )
        )}
      </ul>
      <Loader isVisible={dependency.pendingAction} size={20} />
    </div>
  );
}
