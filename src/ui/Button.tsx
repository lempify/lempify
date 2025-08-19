export default function Button({
  children,
  onClick,
  className = '',
  size = 'sm',
  disabled = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
  size?: 'sm' | 'xs' | 'md' | 'lg';
  disabled?: boolean;
}) {
  return (
    <button
      className={`disabled:opacity-50 disabled:cursor-not-allowed rounded-full ${
        size === 'sm'
          ? 'text-xs px-2 py-1'
          : size === 'xs'
            ? 'text-xs px-1.5 py-0.5'
            : size === 'md'
              ? 'text-sm px-3 py-2'
              : 'text-base px-4 py-3'
      } ${className}`}
      onClick={onClick}
      {...{ disabled }}
    >
      {children}
    </button>
  );
}
