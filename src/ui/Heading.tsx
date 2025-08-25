import { headerGradient } from './css';
import { SvgHelp } from './Svg';
import Tooltip from './Tooltip';

const tailwindCssMap = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
  none: '',
};

export default function Heading({
  size,
  subheading,
  className,
  title,
  helpText = '',
  split = false,
  align = 'none',
}: {
  size: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  subheading?: string;
  className?: string;
  title: string;
  helpText?: string;
  split?: boolean;
  align?: 'none' | 'left' | 'center' | 'right';
}) {
  let firstWordClassName = '';
  const HeadingElement = size;
  let headingClassName = `${tailwindCssMap[align]} `;
  if (size === 'h1') {
    headingClassName += `
    md:text-8xl text-6xl leading-[1.2] text-transparent font-semibold  
    mb-2
    bg-clip-text 
    break-all 
    ${headerGradient} 
    `;
    if (split) {
      firstWordClassName =
        'text-lg font-normal block text-neutral-700 dark:text-neutral-300 -mb-4';
    }
  }
  if (size === 'h2') {
    headingClassName +=
      'text-neutral-900 dark:text-neutral-100 text-4xl font-medium ';
    if (split) {
      firstWordClassName =
        'text-sm font-normal block text-neutral-700 dark:text-neutral-300';
    }
  }
  if (size === 'h3') {
    headingClassName +=
      'text-neutral-900 dark:text-neutral-100 text-xl font-medium ';
    if (split) {
      firstWordClassName =
        'text-sm font-normal block text-neutral-700 dark:text-neutral-300';
    }
  }

  if (size === 'h4') {
    headingClassName += 'text-md font-medium ';
  }

  const titleParts = title.split(' ');
  const newTitle =
    titleParts.length > 1 ? (
      <>
        <span className={firstWordClassName}>{titleParts.at(0)}</span>{' '}
        {titleParts.slice(1).join(' ')}
      </>
    ) : (
      title
    );
  return (
    <>
      <HeadingElement className={`${headingClassName}${className ?? ''}`}>
        {newTitle}
        {helpText && (
          <Tooltip text={helpText}>
            <SvgHelp
              size={16}
              className='ml-2 mt-1 text-neutral-500 dark:text-neutral-400'
            />
          </Tooltip>
        )}
      </HeadingElement>
      {subheading && (
        <p className='text-neutral-600 dark:text-neutral-400'>{subheading}</p>
      )}
    </>
  );
}
