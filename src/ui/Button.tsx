export default function Button({
  children,
  onClick,
  className = '',
  size = '',
  disabled = false,
  isRounded = false,
  variant = null,
}: {
  children: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
  className?: string;
  size?: '' | 'sm' | 'xs' | 'md' | 'lg';
  disabled?: boolean;
  isRounded?: boolean;
  variant?: 'default' | 'primary' | 'secondary' | 'tertiary' | null;
}) {
  let variantClass = '';
  if (variant) {
    if( variant === 'default') {
      variantClass = 'bg-white text-black';
    } else if (variant === 'primary') {
      variantClass = 'bg-[var(--lempify-primary)] text-white border border-[var(--lempify-primary-dark)] hover:bg-[var(--lempify-primary-dark)]';
    } else if (variant === 'secondary') {
      variantClass = 'bg-[var(--lempify-secondary)] text-white border border-[var(--lempify-secondary-dark)] hover:bg-[var(--lempify-secondary-dark)]';
    } else if (variant === 'tertiary') {
      variantClass = 'bg-[var(--lempify-tertiary)] text-white';
    }
  }
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
      } ${variantClass} ${className}`}
      onClick={onClick}
      {...{ disabled }}
    >
      {children}
    </button>
  );
}
