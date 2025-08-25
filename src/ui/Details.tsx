import { useEffect, useRef, useState } from 'react';

export default function Details({
  children,
  summary,
  icon = {
    size: 16,
  },
  onToggle,
  ...props
}: {
  children: React.ReactNode;
  summary: (open: boolean) => React.ReactNode;
  icon?: {
    size?: number;
  };
  onToggle?: (open: boolean) => void;
} & React.HTMLAttributes<HTMLDetailsElement>) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const toggle = () => {
      if (detailsRef.current !== null) {
        setIsOpen(detailsRef.current.open);
        if (onToggle) {
          onToggle(detailsRef.current.open);
        }
      }
    };
    if (detailsRef.current) {
      detailsRef.current.addEventListener('toggle', toggle);
      return () => {
        detailsRef.current?.removeEventListener('toggle', toggle);
      };
    }
  }, [detailsRef, onToggle]);

  return (
    <details ref={detailsRef} {...props}>
      <summary
        className={`flex items-center gap-2 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-opacity duration-300`}
      >
        {summary(isOpen)}
        <div
          className='relative flex items-center justify-center'
          style={{
            width: icon.size ? `${icon.size}px` : '20px',
            height: icon.size ? `${icon.size}px` : '20px',
          }}
        >
          <span className="absolute inset-x-0 h-[2px] w-full bg-neutral-400 dark:bg-neutral-300"></span>
          <span className="absolute inset-x-0 h-[2px] w-full bg-neutral-400 dark:bg-neutral-300 group-not-open:rotate-270 motion-safe:transition-transform motion-safe:duration-200 ease-in-out"></span>
        </div>
      </summary>
      {/* Necessary to avoid children being too close to the summary */}
      <div className='pt-8'>{children}</div>
    </details>
  );
}
