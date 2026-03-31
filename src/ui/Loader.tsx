import { SvgSpinner } from './Svg';

export default function Loader({
  isVisible = false,
  size = 50,
  className = '',
  children,
}: {
  isVisible?: boolean;
  size?: number;
  className?: string;
  children?: React.ReactNode;
}) {
  return isVisible ? (
    <div
      className={`
      absolute top-0 left-0 w-full h-full
      bg-white/30 dark:bg-black/30
      shadow-inner-lg shadow-white/10 dark:shadow-black/10
      flex flex-col items-center justify-center gap-5 overflow-y-auto 
      ${className}
     `}
    >
      <SvgSpinner size={size} />
      {children}
    </div>
  ) : null;
}
