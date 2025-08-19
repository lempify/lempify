import { useNavigate } from 'react-router-dom';
import Button from './Button';
import { buttonPrimary, monoGradientToLeft } from './css';

export default function InstallTrust() {
  const navigate = useNavigate();
  return (
    <div className='grid grid-rows-[1fr_auto] gap-4 min-h-full'>
      <div>
        <header className='text-right mb-10'>
          <h1
            className={`relative text-6xl font-bold ${monoGradientToLeft} text-transparent bg-clip-text inline-flex`}
          >
            {'Trust'}
          </h1>
        </header>
       
        <hr className='my-10 border-neutral-300 dark:border-neutral-700' />
        <p>
          Lempifyd is a tool that helps you install and manage services and
          tools on your system.
        </p>
      </div>
      <div className='text-right sticky bottom-0'>
        <Button
          className={`text-sm ${buttonPrimary}`}
          onClick={() => {
            navigate('/install/tools');
          }}
        >
          {'<'}
        </Button>
      </div>
    </div>
  );
}
