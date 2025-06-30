import SvgSpinner from './SvgSpinner';

export default function Loader({ isVisible = false }: { isVisible?: boolean }) {
  return isVisible ? (
    <div className='absolute top-0 left-0 w-full h-full bg-neutral-200/50 dark:bg-neutral-800/50'>
      <div
        className={`absolute top-[50%] right-[50%] translate-x-[50%] translate-y-[-50%]`}
      >
        <SvgSpinner />
      </div>
    </div>
  ) : null;
}
