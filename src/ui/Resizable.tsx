import { CSSProperties, PropsWithChildren, useEffect, useRef } from 'react';

import SvgResize from './Svg/SvgResize';
import { Resizable as ResizableApi } from '../utils/resizable';
import { getPreferences, setPreferences } from '../utils/storage';

export default function Resizable({ children }: PropsWithChildren) {
  const el = {
    container: useRef<HTMLDivElement>(null),
    resizer: useRef<HTMLDivElement>(null),
    handle: useRef<HTMLDivElement>(null),
  };

  const preferences = getPreferences();

  const resizable = useRef<ResizableApi | null>(null);

  useEffect(() => {
    if (el.container.current && el.resizer.current && el.handle.current) {
      resizable.current = new ResizableApi(el.container.current, {
        elementResizer: el.resizer.current,
        elementHandle: el.handle.current,
        onResize: (dimension) => setPreferences({
          ...getPreferences(),
          sidebarWidth: dimension,
        }),
      });
      return () => resizable.current?.destroy();
    }
  }, [el.container, el.resizer, el.handle]);

  return (
    <div
      className='resizable relative z-1 min-w-[56px]'
      ref={el.container}
      style={
        {
          width: `${preferences.sidebarWidth ?? 250}px`,
          '--resizable-direction': 'x',
          '--resizable-min-dimension': '56px',
          '--resizable-handle-dimension': '10px',
          '--resizable-snap-threshold': '20px',
        } as CSSProperties
      }
    >
      <div className='resizable__resizer' ref={el.resizer}>
        <div className='resizable__resizer-content'>{children}</div>
        <div
          className='resizable__resizer-handle text-neutral-900 dark:text-neutral-100 -right-[5px] before:bg-neutral-300 dark:before:bg-neutral-700 hover:before:bg-neutral-400 dark:hover:before:bg-neutral-600 group'
          ref={el.handle}
        >
          <SvgResize size={[10, 20]} className='bg-neutral-200 dark:bg-neutral-800 rounded-full p-0' />
        </div>
      </div>
    </div>
  );
}
