import { CSSProperties, PropsWithChildren, useEffect, useRef } from 'react';

import { Resizable } from '../utils/resizer';

export default function Resizer({ children }: PropsWithChildren) {
  const el = {
    container: useRef<HTMLDivElement>(null),
    resizer: useRef<HTMLDivElement>(null),
    handle: useRef<HTMLDivElement>(null),
  };

  const resizable = useRef<Resizable | null>(null);

  useEffect(() => {
    if (el.container.current && el.resizer.current && el.handle.current) {
      resizable.current = new Resizable(el.container.current, {
        elementResizer: el.resizer.current,
        elementHandle: el.handle.current,
      });
      return () => resizable.current?.destroy();
    }
  }, [el.container, el.resizer, el.handle]);

  return (
    <div
      className='ec-resizable relative z-1 min-w-[250px] border-r border-neutral-300 dark:border-neutral-700'
      ref={el.container}
      style={
        {
          '--ec-resizable-handle-dimension': '30px',
          '--ec-resizable-init-dimension': '60%',
          //   '--ec-resizable-snap': 'next',
          '--ec-resizable-direction': 'x', // or y,
          '--ec-resizable-snap-threshold': '15',
          '--ec-resizable-bg-color': 'rgba(255,255,255,0.8)',
        } as CSSProperties
      }
    >
      {/* <code className='ec-resizable__debug'></code> */}
      <div className='ec-resizable__resizer' ref={el.resizer}>
        <div className='ec-resizable__resizer-content'>{children}</div>
        <div
          className='ec-resizable__resizer-handle absolute-100'
          ref={el.handle}
        >
          <svg
            xmlns='http://www.w3.org/2000/svg'
            width='20'
            height='20'
            viewBox='0 0 20 20'
          >
            <path d='M11 2v16h2V2zm-4 0v16h2V2zm11 8l-3-3v6l3-3zm-16 0l3-3v6l-3-3z'></path>
          </svg>
        </div>
      </div>
    </div>
  );
}
