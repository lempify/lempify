import Page from './Page';

export default function Page404() {
  return (
    <Page
      title='Page Not Found'
      description='The requested page could not be found'
    >
      <div className='flex flex-col items-center justify-center min-h-[400px] text-center'>
        <h1 className='text-4xl font-bold text-neutral-800 dark:text-neutral-200 mb-4'>
          404
        </h1>
        <h2 className='text-2xl font-semibold text-neutral-700 dark:text-neutral-300 mb-4'>
          Page Not Found
        </h2>
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
