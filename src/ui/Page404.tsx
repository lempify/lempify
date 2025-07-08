import Heading from './Heading';
import Page from './Page';

export default function Page404() {
  return (
    <Page
      title='404 - Page Not Found'
      description='The requested page could not be found'
    >
      <div className='flex flex-col items-center justify-center min-h-[400px] text-center'>
        <Heading size='h2' title='Page Not Found' />
        <p className='text-neutral-600 dark:text-neutral-400 mb-6 max-w-md'>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <a
          href='/'
          className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
        >
          Go to Dashboard
        </a>
      </div>
    </Page>
  );
}
