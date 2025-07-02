import { primaryGradientToLeft } from './css';

export default function Heading({
  size,
  subheading,
  children,
}: {
  size: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  subheading?: string;
  children: React.ReactNode;
}) {
  const HeadingElement = size;
  let className = '';
  if (size === 'h1') {
    className = `
                text-8xl leading-[1.2] text-transparent font-extrabold  
                mb-2 inline-flex 
                bg-clip-text 
                ${primaryGradientToLeft}
            `;
  }
  if (size === 'h2') {
    className = 'text-4xl text-[var(--lempify-secondary)] mb-8';
  }
  return (
    <div>
      <HeadingElement className={className}>{children}</HeadingElement>
      {subheading && (
        <p className='text-neutral-600 dark:text-neutral-400'>{subheading}</p>
      )}
    </div>
  );
}
