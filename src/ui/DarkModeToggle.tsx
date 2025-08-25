import { useDarkMode } from '../context/DarkModeContext';
import { SvgMoon, SvgSun, SvgSystem } from './Svg';

const themes = ['light', 'system', 'dark'] as const;

const iconBtnCss =
  'flex-1 ' +
  'w-[var(--btn-width)] ' +
  'z-10 ' +
  'text-[0.6rem] font-medium text-zinc-600 dark:text-zinc-300 ' +
  'transition-colors duration-200 ' +
  'flex items-center justify-center';

const sliderCss =
  'absolute ' +
  'h-5 w-[var(--btn-width)] ' +
  'bg-white rounded-full shadow ' +
  'motion-safe:transition-transform motion-safe:duration-300';

const containerCss = `
  relative 
  h-6 
  bg-neutral-200 dark:bg-neutral-700 
  rounded-full 
  flex items-center 
  inset-shadow-2xs
  border-1 border-neutral-300 dark:border-neutral-700
  px-0.5
`;

const containerStyles = {
  '--btn-width': '30px',
  '--btns-width': `calc(var(--btn-width) * ${themes.length})`,
} as React.CSSProperties;

export default function DarkModeToggle() {
  const { theme, setTheme } = useDarkMode();

  const activeIndex = themes.findIndex(t => theme === t);

  return (
    <div className={containerCss} style={containerStyles}>
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
          className={`${iconBtnCss} ${index === activeIndex ? 'text-zinc-300 dark:text-zinc-600' : ''}`}
        >
          {value === 'light' ? (
            <SvgSun size={14} />
          ) : value === 'dark' ? (
            <SvgMoon size={14} />
          ) : (
            <SvgSystem size={14} />
          )}
        </button>
      ))}
    </div>
  );
}
