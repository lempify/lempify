import Heading from './Heading';

export default function RouteHeader({
  title,
  description,
}: {
  title: string;
  description: string | (() => React.ReactNode);
}) {
  const descriptionElement =
    typeof description === 'function' ? description() : description;
  return (
    <header className='mb-10 relative'>
      <Heading size='h1' title={title} />
      <p className='text-neutral-600 dark:text-neutral-400'>
        {descriptionElement}
      </p>
    </header>
  );
}
