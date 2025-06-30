import { useSearchParams } from 'react-router-dom';
import Page from './Page';

export default function Site404() {
  const [searchParams] = useSearchParams();
  const domain = searchParams.get('domain') || 'unknown';

  return (
    <Page
      title='Site Not Found'
      description='The requested site could not be found'
    >
      <div className='flex flex-col items-center justify-center min-h-[400px] text-center'>
        <h1 className='text-2xl font-bold text-red-600 dark:text-red-400 mb-4'>
          Site Not Found
        </h1>
        <p className='text-neutral-600 dark:text-neutral-400 mb-6'>
          The site "{domain}" could not be found in your LEMP stack.
        </p>
        <a
          href='/sites'
          className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
        >
          View All Sites
        </a>
      </div>
    </Page>
  );
}
