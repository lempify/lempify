import { headerGradient } from './css';

export default function Heading({
  size,
  subheading,
  className,
  title,
}: {
  size: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  subheading?: string;
  className?: string;
  title: string;
}) {
  let firstWordClassName = '';
  const HeadingElement = size;
  let headingClassName = '';
  if (size === 'h1') {
    headingClassName = `
    text-8xl leading-[1.2] text-transparent font-semibold  
    mb-2 inline-flex 
    bg-clip-text 
    ${headerGradient}
    `;
  }
  if (size === 'h2') {
    headingClassName = 'text-neutral-900 dark:text-neutral-100 text-4xl font-medium';
    firstWordClassName = 'text-sm font-normal block text-neutral-700 dark:text-neutral-300';
  }

  const titleParts = title.split(' ');
  const newTitle = (
    <>
      <span className={firstWordClassName}>
        {titleParts.at(0)}
      </span>{' '}
      {titleParts.slice(1).join(' ')}
    </>
  );
  return (
    <>
      <HeadingElement className={`${headingClassName} ${className}`}>
        {newTitle}
      </HeadingElement>
      {subheading && (
        <p className='text-neutral-600 dark:text-neutral-400'>{subheading}</p>
      )}
    </>
  );
}
