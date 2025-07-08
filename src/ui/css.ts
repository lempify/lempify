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
  bg-neutral-700 hover:bg-neutral-900 
  
  text-white hover:text-[var(--lempify-secondary)] dark:hover:text-neutral-300 

  px-4 
  py-2 
  rounded 
  disabled:opacity-50
`;

export const headerGradient =
  'bg-gradient-to-r from-neutral-700 to-neutral-900 dark:from-white dark:to-neutral-300';

export const primaryGradientToLeft =
  'bg-gradient-to-l from-[var(--lempify-secondary)] to-[var(--lempify-primary)] dark:from-[var(--lempify-secondary)] dark:to-[var(--lempify-primary)]';
