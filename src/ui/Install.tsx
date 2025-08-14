import { SERVICES, TOOLS } from '../constants';
import { Status, useLempifyd } from '../context/LempifydContext';
import Loader from './Loader';
import { SvgError, SvgSuccess, SvgWarning } from './Svg';

const ICON_MAP = {
  success: <SvgSuccess className='text-green-500' size={16} />,
  error: <SvgError className='text-red-500' size={16} />,
  warning: <SvgWarning className='text-yellow-500' size={16} />
} as const;

const BASE_CONTAINER_CLASS = 'bg-white p-4 rounded-md shadow-md relative border border-gray-300';

const getStatusConfig = (formulae: any) => {
  
  if (!formulae.isInstalled) {
    return {
      statusText: 'Not installed',
      containerClassName: `${BASE_CONTAINER_CLASS} ${formulae.isRequired ? 'border-red-500' : 'border-yellow-500'}`,
      iconComponent: formulae.isRequired ? ICON_MAP.error : ICON_MAP.warning
    };
  }
  
  if (!formulae.isRunning) {
    return {
      statusText: 'Installed, but not running',
      containerClassName: `${BASE_CONTAINER_CLASS} border-green-500 border-red-500`,
      iconComponent: ICON_MAP.error
    };
  }
  
  return {
    statusText: formulae.formulaeType === 'service' ? 'Installed and running' : 'Installed',
    containerClassName: `${BASE_CONTAINER_CLASS} border-green-500`,
    iconComponent: ICON_MAP.success
  };
};

function Card({ formulae }: { formulae: Status }) {
  const { statusText, containerClassName, iconComponent } = getStatusConfig(formulae);

  return (
    <div className={`${containerClassName}`}>
      <h3>
        <span className='font-bold'>{formulae.humanName}</span>{' '}
        {formulae.version && <sup>v{formulae.version}</sup>}
      </h3>

      {formulae.pendingAction ? (
        <p className='text-xs text-gray-500'>Checking...</p>
      ) : (
        <p className='flex items-center gap-2 text-xs'>
          {iconComponent}
          {statusText}
        </p>
      )}
      <Loader isVisible={formulae?.pendingAction ?? true} size={16} />
    </div>
  );
}

/**
 * Install:
 * - Welcome
 * - Required services
 * - Optional services
 */
export default function Install() {
  const {
    state /* : { isAllServicesRunning, servicesCount, runningServicesCount } */,
    dispatch,
  } = useLempifyd();

  const stateTools = { ...TOOLS, ...state.tools };
  const stateServices = {
    ...SERVICES,
    ...state.services,
  };

  const { false: optionalTools = [], true: requiredTools = [] } =
    Object.groupBy<any, any>(
      Object.values(stateTools),
      (tool: any) => tool.isRequired
    );
  const { false: optionalServices = [], true: requiredServices = [] } =
    Object.groupBy<any, any>(
      Object.values(stateServices),
      (service: any) => service.isRequired
    );

  return (
    <div className='w-screen h-screen flex items-center justify-center flex-col bg-gray-100 overflow-y-auto'>
      <div className='w-full md:w-2/3 lg:w-1/2 bg-white p-10 rounded-md shadow-md'>
        <h1 className='text-center text-8xl font-bold mb-10'>Install</h1>

        <>
          <h2 className='text-2xl font-bold mb-4'>Services</h2>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-10'>
            <div>
              <h3>Required</h3>
              <div className='grid grid-cols-1 xl:grid-cols-2 gap-4'>
                {requiredServices.map((service: any) => (
                  <Card key={service.name} formulae={service} />
                ))}
              </div>
            </div>
            <div>
              <h3>Optional</h3>
              <div className='grid grid-cols-1 xl:grid-cols-2 gap-4'>
                {optionalServices.map((service: any) => (
                  <Card key={service.name} formulae={service} />
                ))}
              </div>
            </div>
          </div>

          <h2 className='text-2xl font-bold mb-4'>Tools</h2>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <h3>Required</h3>
              <div className='grid grid-cols-1 xl:grid-cols-2 gap-4'>
                {requiredTools.map((tool: any) => (
                  <Card key={tool.name} formulae={tool} />
                ))}
              </div>
            </div>
            <div>
              <h3>Optional</h3>
              <div className='grid grid-cols-1 xl:grid-cols-2 gap-4'>
                {optionalTools.map((tool: any) => (
                  <Card key={tool.name} formulae={tool} />
                ))}
              </div>
            </div>
          </div>
        </>
      </div>

      <div className='grid grid-cols-2 gap-4'>
        <pre>
          {JSON.stringify({ requiredServices, optionalServices }, null, 2)}
        </pre>
        <pre>{JSON.stringify({ requiredTools, optionalTools }, null, 2)}</pre>
      </div>
    </div>
  );
}
