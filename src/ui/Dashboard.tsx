import { useLempifyd } from '../context/LempifydContext';

import RouteHeader from './RouteHeader';

const DASHBOARD_DESCRIPTION =
  'Welcome to Lempify. This is the dashboard for your Lempify instance. Here you can manage your sites, users, and settings.';

export default function Dashboard() {
  const { state } = useLempifyd();

  return (
    <>
      <RouteHeader title='Dashboard' description={DASHBOARD_DESCRIPTION} />

      <div className='flex flex-col'>
        <div className='grid grid-cols-2 gap-4'>
          <div className='bg-white p-4 rounded-lg'>
            <h2 className='text-lg font-bold'>Services</h2>
            <pre>{JSON.stringify(state.services, null, 2)}</pre>
          </div>
          <div className='bg-white p-4 rounded-lg'>
            <h2 className='text-lg font-bold'>Events</h2>
            <pre>{JSON.stringify(state.events.reverse(), null, 2)}</pre>
          </div>
        </div>
        Coming soon...
      </div>
    </>
  );
}
