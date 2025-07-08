const circleCss = `
  absolute

  shadow-xs
  
  rounded-full

  animate-grow
`;

const tailwindColors = [
  'bg-neutral-50 dark:bg-neutral-900',
  'bg-neutral-100 dark:bg-neutral-800',
  'bg-neutral-200 dark:bg-neutral-700',
  'bg-neutral-300 dark:bg-neutral-600',
  'bg-neutral-400 dark:bg-neutral-500',
  'bg-neutral-500 dark:bg-neutral-400',
];


export default function Loader({ isVisible = false, size = 100, count = 5 }: { isVisible?: boolean, size?: number, count?: number }) {
  return isVisible ? (
    <div className='absolute top-0 left-0 w-full h-full flex items-center justify-center bg-neutral-200/50 dark:bg-neutral-800/50'>
      <div className={`relative`} style={{ width: `${size}px`, height: `${size}px` }}>
        {Array.from({ length: count }).map((_, index) => {
          const color = tailwindColors[index];
          return (
            <div
              key={index}
              style={{
                animationDelay: `${index * 100}ms`,
                inset: `${index * 10}%`,
              }}
              className={`${circleCss} ${color}`}
            ></div>
          );
        })}
      </div>
    </div>
  ) : null;
}
