import { Status, useLempifyd } from '../context/LempifydContext';
import Loader from './Loader';
import { SvgError, SvgSuccess, SvgWarning } from './Svg';

function Card({ formulae }: { formulae: Status }) {

  // If not installed, show 'Not installed'
  // If installed, show 'Installed'
  // If installed and running, show 'Installed and running'
  let statusText = 'Pending';
  let status = 'error';
  if (formulae.is_installed) {
    statusText = 'Installed';
    status = 'success';
    if (formulae.is_running && formulae.formulae_type === 'service') {
      statusText = 'Running';
      status = 'success';
    }
  } else {
    statusText = 'Not installed';
  }

  return (
    <div className='bg-white p-4 rounded-md shadow-md relative'>
      <h3 className='font-bold'>{formulae.name}</h3>
      <ul className='text-sm'>
        <li>v{formulae.version}</li>
        {formulae.is_installed ? (
          <li className='flex items-center gap-2 text-xs'>
            <SvgSuccess className='text-green-500' size={16} />
            {statusText}
          </li>
        ) : (
          <li className='flex items-center gap-2 text-xs'>
            {formulae.is_required ? (
              <SvgError className='text-red-500' size={16} />
            ) : (
              <SvgWarning className='text-yellow-500' size={16} />
            )}
            {statusText}
          </li>
        )}
      </ul>
      <Loader isVisible={formulae.pendingAction} />
    </div>
  );
}

export default function Install() {
  const {
    state /* : { isAllServicesRunning, servicesCount, runningServicesCount } */,
    dispatch,
  } = useLempifyd();

  const { false: optionalTools = [], true: requiredTools = [] } =
    Object.groupBy<any, any>(
      Object.values(state.tools),
      (tool: any) => tool.is_required
    );
  const { false: optionalServices = [], true: requiredServices = [] } =
    Object.groupBy<any, any>(
      Object.values(state.services),
      (service: any) => service.is_required
    );

  return (
    <div className='w-screen h-screen flex items-center justify-center flex-col bg-gray-100 overflow-y-auto'>
      <div className='w-full md:w-2/3 lg:w-1/2 bg-white p-10 rounded-md shadow-md'>
        <h1 className='text-center text-8xl font-bold mb-10'>Install</h1>

        <h2 className='text-2xl font-bold mb-4'>Services</h2>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-10'>
          <div>
            <h3>Required</h3>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {requiredServices.map((service: any) => (
                <Card key={service.name} formulae={service} />
              ))}
            </div>
          </div>
          <div>
            <h3>Optional</h3>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
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
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {requiredTools.map((tool: any) => (
                <Card key={tool.name} formulae={tool} />
              ))}
            </div>
          </div>
          <div>
            <h3>Optional</h3>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {optionalTools.map((tool: any) => (
                <Card key={tool.name} formulae={tool} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* <div className='grid grid-cols-2 gap-4'>
        <pre>
          {JSON.stringify({ requiredServices, optionalServices }, null, 2)}
        </pre>
        <pre>{JSON.stringify({ requiredTools, optionalTools }, null, 2)}</pre>
      </div> */}
    </div>
  );
}
