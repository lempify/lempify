import { useNavigate } from 'react-router-dom';
import { Status, useLempifyd } from '../context/LempifydContext';
import Button from './Button';
import { buttonPrimary, monoGradientToLeft } from './css';
import Loader from './Loader';
import { SvgError, SvgSpinner, SvgSuccess, SvgWarning } from './Svg';
import SvgLink from './Svg/SvgLink';
import Heading from './Heading';
import Tooltip from './Tooltip';

const ICON_MAP = {
  success: <SvgSuccess className='text-green-500 dimension-4' size={16} />,
  error: <SvgError className='text-red-500 dimension-4' size={16} />,
  warning: <SvgWarning className='text-yellow-500 dimension-4' size={16} />,
  pending: <SvgSpinner size={16} />,
} as const;

const BASE_CONTAINER_CLASS =
  'group bg-white dark:bg-black text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 py-4 pl-5 pr-4 relative border border-neutral-200 dark:border-neutral-900'; /* before:content-[""] before:absolute before:top-0 before:left-0 before:h-full before:w-[10px] */

const getStatusConfig = (formulae: any) => {
  if (!formulae.isInstalled) {
    return {
      statusText: 'Not installed',
      containerClassName:
        /* `${formulae.isRequired ? 'hover:border-red-500 before:bg-red-500' : 'hover:border-yellow-500 before:bg-yellow-500'}` */ '',
      iconComponent: formulae.isRequired ? ICON_MAP.error : ICON_MAP.warning,
      statusType: 'not-installed',
    };
  }

  if (!formulae.isRunning) {
    return {
      statusText: 'Installed, but not running',
      containerClassName: /* `hover:border-green-500 before:bg-green-400` */ '',
      iconComponent: ICON_MAP.warning,
      statusType: 'not-running',
    };
  }

  return {
    statusText:
      formulae.dependencyType === 'service'
        ? 'Installed and running'
        : 'Installed',
    containerClassName: /* `hover:border-green-500 before:bg-green-400` */ '',
    iconComponent: ICON_MAP.success,
    statusType: 'installed',
  };
};

function Card({ formulae }: { formulae: Status }) {
  const { statusText, containerClassName, iconComponent, statusType } =
    getStatusConfig(formulae);
  const { emit } = useLempifyd();

  return (
    <li className={`${BASE_CONTAINER_CLASS} ${containerClassName}`}>
      <h3 className='truncate'>
        <span>{formulae.humanName}</span>{' '}
        {formulae.version && <sup>v{formulae.version}</sup>}
      </h3>
      {!formulae.pendingAction &&
        (statusType === 'not-installed' || statusType === 'not-running') && (
          <div className='text-xs text-gray-500 absolute inset-0 flex items-center justify-center group-hover:opacity-100 group-hover:bg-neutral-100/50 dark:group-hover:bg-neutral-900/50 opacity-0 motion-safe:transition-opacity motion-safe:duration-300'>
            {statusType === 'not-installed' && (
                <Button
                  size='sm'
                  className={`${buttonPrimary}`}
                  onClick={() => emit(formulae.name, 'install')}
                >
                  Install
                </Button>
            )}
            {statusType === 'not-running' && (
                <Button
                  size='sm'
                  className={`${buttonPrimary}`}
                  onClick={() => emit(formulae.name, 'start')}
                >
                  Start
                </Button>
            )}
            <a
              className={`${buttonPrimary} rounded-full ml-2`}
              href={formulae.url}
              target='_blank'
              rel='noopener noreferrer'
            >
              <SvgLink size={16} />
            </a>
          </div>
        )}
      {formulae.pendingAction ? (
        <p className='text-xs text-gray-500'>Checking...</p>
      ) : (
        <p className='flex items-center gap-2'>
          <span className='dimension-4'>{iconComponent}</span>
          <span className='text-xs'>{statusText}</span>
          {formulae.url && (
            <a href={formulae.url} target='_blank' rel='noopener noreferrer'>
              <SvgLink size={16} />
            </a>
          )}
        </p>
      )}
      <Loader isVisible={formulae?.pendingAction ?? true} size={16} />
    </li>
  );
}

function InstallStatus({
  optionalDependencies,
  requiredDependencies,
}: {
  optionalDependencies: Status[];
  requiredDependencies: Status[];
}) {
  const requiredCount = requiredDependencies.filter(
    dependency => !dependency.isInstalled && !dependency.pendingAction
  ).length;
  const requiredRunningCount = requiredDependencies.filter(
    dependency =>
      dependency.isInstalled &&
      !dependency.isRunning &&
      !dependency.pendingAction
  ).length;
  const optionalCount = optionalDependencies.filter(
    dependency => !dependency.isInstalled && !dependency.pendingAction
  ).length;
  const pendingCount = [
    ...requiredDependencies,
    ...optionalDependencies,
  ].filter(dependency => dependency.pendingAction).length;

  const plural = (count: number) => (count === 1 ? 'install' : 'installs');

  return (
    <div className='my-4'>
      <Heading size='h3' className='mb-4' title='Install Status:' />
      <ul className='flex gap-2 text-xs text-neutral-600 dark:text-neutral-400'>
        {pendingCount > 0 && (
          <li className='flex items-center gap-2 relative'>
            {ICON_MAP.pending} {pendingCount} pending {plural(pendingCount)}
          </li>
        )}
        {requiredCount > 0 && (
          <li className='flex items-center gap-2'>
            {ICON_MAP.error} {requiredCount} required {plural(requiredCount)}
          </li>
        )}
        {requiredRunningCount > 0 && (
          <li className='flex items-center gap-2'>
            {ICON_MAP.warning} {requiredRunningCount} inactive{' '}
            {plural(requiredRunningCount)}
          </li>
        )}
        {optionalCount > 0 && (
          <li className='flex items-center gap-2'>
            {ICON_MAP.warning} {optionalCount} optional {plural(optionalCount)}
          </li>
        )}
      </ul>
    </div>
  );
}

/**
 * Install:
 * - Welcome
 * - Required services
 * - Optional services
 */
export default function InstallDependencies({
  title,
  dependencies,
}: {
  title: string;
  dependencies: any;
}) {
  const { false: optionalDependencies = [], true: requiredDependencies = [] } =
    Object.groupBy<any, any>(
      Object.values(dependencies),
      (tool: any) => tool.isRequired
    );

  const dependenciesValid = requiredDependencies.every(
    dependency => dependency.isInstalled && dependency.isRunning
  );

  return (
    <div className='grid grid-rows-[1fr_auto] gap-4'>
      <div>
        <Heading
          size='h2'
          className='mb-10'
          title={title}
          split
          align='right'
        />
        {!dependenciesValid && (
          <InstallStatus
            optionalDependencies={optionalDependencies}
            requiredDependencies={requiredDependencies}
          />
        )}
        <hr className='my-10 border-neutral-300 dark:border-neutral-700' />
        <ul className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-10'>
          {[
            {
              title: 'Required',
              dependencies: requiredDependencies,
              tooltipText:
                'These are dependencies that are required for Lempify to function properly.',
            },
            {
              title: 'Optional',
              dependencies: optionalDependencies,
              tooltipText:
                'These are optional dependencies that are not required for Lempify to function properly, but are recommended.',
            },
          ].map(
            ({
              title,
              dependencies,
              tooltipText,
            }: {
              title: string;
              dependencies: any[];
              tooltipText: string;
            }) => (
              <li key={title}>
                <Heading
                  size='h3'
                  className='mb-4'
                  title={title}
                  helpText={tooltipText}
                />
                <ul className='grid grid-cols-1 2xl:grid-cols-2 gap-4'>
                  {dependencies.map((dependency: any) => (
                    <Card key={dependency.name} formulae={dependency} />
                  ))}
                </ul>
              </li>
            )
          )}
        </ul>
      </div>
    </div>
  );
}
