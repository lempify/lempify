import Dialog from './Dialog';
import Button from './Button';
import Loader from './Loader';
import { SvgPhp } from './Svg';
import { Status, useLempifyd } from '../context/LempifydContext';
import SvgLink from './Svg/SvgLink';
import { buttonWithArrow } from './css';
import Dot from './Dot';

const BTN = `mr-4 ${buttonWithArrow}`;

function sortPhpDesc(a: Status, b: Status): number {
  const [aMaj, aMin = '0'] = a.name.replace('php@', '').split('.');
  const [bMaj, bMin = '0'] = b.name.replace('php@', '').split('.');
  const majDiff = parseInt(bMaj) - parseInt(aMaj);
  return majDiff !== 0 ? majDiff : parseInt(bMin) - parseInt(aMin);
}

export default function PhpServicesGroup({
  services,
  emit,
  className = '',
}: {
  services: Status[];
  emit: (name: string, action: string) => Promise<void>;
  className?: string;
}) {
  const { dispatch } = useLempifyd();

  function clearError(name: string) {
    dispatch({ type: 'SERVICE_ERROR', payload: { name, lastError: '' } });
  }

  const [primary, ...secondary] = [...services].sort(sortPhpDesc);

  if (!primary) return null;

  return (
    <div className={`min-h-full ${className}`}>
      {/* Primary PHP version */}
      <Dialog
        open={primary.lastError !== ''}
        onClose={() => clearError(primary.name)}
      >
        <p className='text-sm'>
          <strong>{primary.name}:</strong> {primary.lastError}
        </p>
      </Dialog>

      <div className='relative'>
        <p className='flex relative items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300'>
        <Dot status={primary.pendingAction ? 'pending' : primary.isRunning ? 'running' : 'stopped'} size={2} />
          <span>{primary.humanName}</span>
          {primary.url && (
            <a href={primary.url} target='_blank' rel='noopener noreferrer'>
              <SvgLink
                className='hover:text-black dark:hover:text-white'
                size={16}
              />
            </a>
          )}
          <span className='ml-auto size-6 flex items-center justify-center'>
            <SvgPhp />
          </span>
        </p>

        <ul className='flex flex-cols text-neutral-600 dark:text-neutral-400 text-xs mt-2 empty:mt-0'>
          {!primary.isInstalled ? (
            <Button
              className={BTN}
              onClick={() => emit(primary.name, 'install')}
            >
              Install
            </Button>
          ) : (
            <>
              {!primary.isRunning && (
                <li>
                  <Button
                    className={BTN}
                    onClick={() => emit(primary.name, 'start')}
                  >
                    Start
                  </Button>
                </li>
              )}
              {primary.isRunning && (
                <li>
                  <Button
                    className={BTN}
                    onClick={() => emit(primary.name, 'stop')}
                  >
                    Stop
                  </Button>
                </li>
              )}
              <li>
                <Button
                  className={BTN}
                  onClick={() => emit(primary.name, 'restart')}
                >
                  Restart
                </Button>
              </li>
              <li>
                <Button
                  className={BTN}
                  onClick={() => emit(primary.name, 'install')}
                >
                  Reinstall
                </Button>
              </li>
              <li>
                <Button
                  className={BTN}
                  onClick={() => emit(primary.name, 'uninstall')}
                >
                  Uninstall
                </Button>
              </li>
            </>
          )}
        </ul>
        <Loader isVisible={primary.pendingAction} size={20} />
      </div>

      {/* Secondary PHP versions */}
      {secondary.length > 0 && (
        <div className='mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-700 space-y-2'>
          {secondary.map(service => (
            <div key={service.name}>
              <Dialog
                open={service.lastError !== ''}
                onClose={() => clearError(service.name)}
              >
                <p className='text-sm'>
                  <strong>{service.name}:</strong> {service.lastError}
                </p>
              </Dialog>
              <div className='relative flex items-center gap-2 flex-wrap'>
                <Dot status={service.pendingAction ? 'pending' : service.isRunning ? 'running' : 'stopped'} size={1.5} />
                <span className='text-xs text-neutral-600 dark:text-neutral-400'>
                  {service.humanName}
                </span>
                <div className='flex gap-1 ml-auto text-xs text-neutral-600 dark:text-neutral-400'>
                  {!service.isInstalled ? (
                    <Button
                      size='xs'
                      className={buttonWithArrow}
                      onClick={() => emit(service.name, 'install')}
                    >
                      Install
                    </Button>
                  ) : (
                    <>
                      {!service.isRunning && (
                        <Button
                          size='xs'
                          className={buttonWithArrow}
                          onClick={() => emit(service.name, 'start')}
                        >
                          Start
                        </Button>
                      )}
                      {service.isRunning && (
                        <Button
                          size='xs'
                          className={buttonWithArrow}
                          onClick={() => emit(service.name, 'stop')}
                        >
                          Stop
                        </Button>
                      )}
                      <Button
                        size='xs'
                        className={buttonWithArrow}
                        onClick={() => emit(service.name, 'restart')}
                      >
                        Restart
                      </Button>
                      <Button
                        size='xs'
                        className={buttonWithArrow}
                        onClick={() => emit(service.name, 'install')}
                      >
                        Reinstall
                      </Button>
                      <Button
                        size='xs'
                        className={buttonWithArrow}
                        onClick={() => emit(service.name, 'uninstall')}
                      >
                        Uninstall
                      </Button>
                    </>
                  )}
                </div>
                <Loader isVisible={service.pendingAction} size={14} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
