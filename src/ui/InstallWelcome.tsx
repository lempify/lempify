import { useLempifyd } from '../context/LempifydContext';
import Button from './Button';

export default function InstallWelcome() {
  const { state } = useLempifyd();

  return (
    <div className='w-screen h-screen flex items-center justify-center flex-col bg-gray-100 overflow-y-auto'>
      <div className='w-full md:w-2/3 lg:w-1/2 bg-white p-10 rounded-md shadow-md'>
        <h1 className='text-center text-8xl font-bold mb-10'>Install</h1>

        <h2 className='text-2xl font-bold mb-4'>Welcome to Lempifyd</h2>
        <div className='mb-10'>
          <h3>What is Lempifyd?</h3>
          <p>
            Lempifyd is a tool that helps you install and manage your
            development environment.
          </p>
        </div>
        <Button onClick={() => {}}>
          Continue
        </Button>
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
