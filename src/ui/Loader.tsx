import { SvgSpinner } from './Svg';

export default function Loader({ isVisible = false, size = 50 }: { isVisible?: boolean, size?: number }) {
  return isVisible ? (
    <div className='
      absolute top-0 left-0 w-full h-full 
      bg-white/30 dark:bg-black/30 
      shadow-inner-lg shadow-white/10 dark:shadow-black/10
     '>
      <div
        className={`absolute top-[50%] right-[50%] translate-x-[50%] translate-y-[-50%]`}
      >
        <SvgSpinner size={size} />
      </div>
    </div>
  ) : null;
}
