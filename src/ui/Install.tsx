const formulae = {
  required: ['nginx', 'php', 'mysql', 'mkcert'],
  optional: ['wp-cli', 'composer', 'redis', 'memcached'],
};

export default function Install() {
  return (
    <div className='flex flex-col gap-4 max-w-md mx-auto'>
      <h1 className='text-2xl font-bold'>Install</h1>
      <p className='text-sm text-gray-500'>
        This will install the required software, using Homebrew, to run Lempify.
      </p>
      <div className='flex flex-col gap-2'>
        <h2 className='text-lg font-bold'>Required Software</h2>
        <ul className='list-disc list-inside'>
          {formulae.required.map(formula => (
            <li key={formula}>{formula}</li>
          ))}
        </ul>
      </div>
      <div className='flex flex-col gap-2'>
        <h2 className='text-lg font-bold'>Optional Software</h2>
        <ul className='list-disc list-inside'>
          {formulae.optional.map(formula => (
            <li key={formula}>{formula}</li>
          ))}
        </ul>
      </div>
      <button className='bg-blue-500 text-white px-4 py-2 rounded-md'>
        Install
      </button>
    </div>
  );
}
