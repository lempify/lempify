import { useDarkMode } from '../context/DarkModeContext';

const themes = ['light', 'system', 'dark'] as const;

export default function DarkModeToggle() {
  const { theme, setTheme } = useDarkMode();

  const activeIndex = themes.findIndex(t => theme === t);

  const toggleCss =
    'flex-1 min-w-[50px] z-10 text-[0.6rem] font-medium text-zinc-600 dark:text-zinc-300 transition-colors duration-200';
  const sliderCss =
    'absolute top-0.5 left-0.5 h-5 w-[50px] bg-white rounded-full shadow transition-transform duration-300';

  return (
    <div className='relative w-[154px] h-6 bg-neutral-200 dark:bg-neutral-700 line-height-none rounded-full flex items-center px-0.5'>
      {/* Sliding Pill */}
      <div
        className={sliderCss}
        style={{ transform: `translateX(${activeIndex * 100}%)` }}
      />

      {/* Options */}
      {themes.map((value, index) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className={`${toggleCss} ${index === activeIndex ? 'text-zinc-300 dark:text-zinc-600' : ''}`}
        >
          {value}
        </button>
      ))}
    </div>
  );
}
