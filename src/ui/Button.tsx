export default function Button({
  children,
  onClick,
  className = '',
  size = '',
  disabled = false,
  isRounded = false,
}: {
  children: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
  className?: string;
  size?: '' | 'sm' | 'xs' | 'md' | 'lg';
  disabled?: boolean;
  isRounded?: boolean;
}) {
  return (
    <button
      className={`disabled:opacity-50 disabled:cursor-not-allowed ${isRounded ? 'rounded-full' : ''} ${
        size === ''
          ? ''
          : size === 'sm'
            ? 'text-xs px-2 py-1'
            : size === 'xs'
              ? 'text-xs px-1.5 py-0.5'
              : size === 'md'
                ? 'text-sm px-3 py-2'
                : size === 'lg'
                  ? 'text-lg px-4 py-3'
                  : 'text-xs px-2 py-1' // default
      } ${className}`}
      onClick={onClick}
      {...{ disabled }}
    >
      {children}
    </button>
  );
}
