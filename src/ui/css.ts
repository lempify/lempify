export const cornerTopRight =
  "before:content-[''] before:absolute before:-top-5 before:-right-[1px] before:w-[1px] before:h-5 " +
  'before:bg-gradient-to-t before:from-neutral-300 before:to-neutral-100/0 dark:before:from-neutral-600 dark:before:to-neutral-900/0 ' +
  "after:content-[''] after:absolute after:-top-[1px] after:-right-5 after:h-[1px] after:w-5 " +
  'after:bg-gradient-to-r after:from-neutral-300 after:to-neutral-100/0 dark:after:from-neutral-600 dark:after:to-neutral-900/0';

export const cornerBottomLeft =
  "before:content-[''] before:absolute before:-bottom-5 before:-left-[1px] before:w-[1px] before:h-5 " +
  'before:bg-gradient-to-b before:from-neutral-300 before:to-neutral-100/0 dark:before:from-neutral-600 dark:before:to-neutral-900/0 ' +
  "after:content-[''] after:absolute after:-bottom-[1px] after:-left-5 after:h-[1px] after:w-5 " +
  'after:bg-gradient-to-l after:from-neutral-300 after:to-neutral-100/0 dark:after:from-neutral-600 dark:after:to-neutral-900/0';

export const pageSection =
  'p-10 w-full ' +
  'border-t border-r border-l border-neutral-300 dark:border-neutral-600 last:border-b ' +
  'bg-neutral-50/80 dark:bg-neutral-900/60 ' +
  'backdrop-blur-[1px] ' +
  'relative';

export const buttonPrimary = `
  bg-white hover:not-disabled:bg-neutral-200 dark:bg-neutral-800 dark:not-disabled:hover:bg-neutral-900
  border border-neutral-200 dark:border-neutral-900
  
  text-black hover:text-neutral-800 dark:text-neutral-200 dark:hover:text-white

  px-4 
  py-2 
  rounded 
  disabled:opacity-50
`;
export const buttonPrimaryXs = `
  text-neutral-700 dark:text-neutral-300 
  bg-white hover:bg-neutral-100 dark:bg-neutral-800 dark:hover:bg-neutral-700
  border border-neutral-300 dark:border-neutral-600 dark:hover:border-neutral-600
  
  rounded
  
  text-xs 
  
  px-1 py-0.5 
`;

export const buttonWithArrow = 'hover:text-black dark:hover:text-white before:content-["﹥"] before:mr-1 before:relative before:inline-flex before:text-[90%]  hover:before:translate-x-1 before:transition-transform before:duration-200 before:ease-in-out';

export const headerGradient =
  'bg-gradient-to-r from-neutral-700 to-neutral-900 dark:from-white dark:to-neutral-300';

export const primaryGradientToLeft =
  'bg-gradient-to-l from-[var(--lempify-secondary)] to-[var(--lempify-primary)] dark:from-[var(--lempify-secondary)] dark:to-[var(--lempify-primary)]';

export const monoGradientToLeft =
  'bg-gradient-to-l from-neutral-900 to-black dark:from-neutral-100 dark:to-white';

export const glowLine = `before:content-[""] before:absolute before:bottom-0 before:left-0 before:w-full before:h-[1px] before:bg-gradient-to-r before:from-transparent before:via-neutral-400 dark:before:via-neutral-500 before:to-transparent`;
