import { buttonWithArrow } from './css';
import SvgLink from './Svg/SvgLink';

export default function Anchor({
  children,
  className,
  isExternal = false,
  variant = 'default',
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & { isExternal?: boolean, variant?: 'default' | 'arrow' | 'link' }) {
  return (
    <a
      className={`${className} ${variant === 'arrow' ? buttonWithArrow : ''} cursor-pointer w-fit`}
      {...props}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noopener noreferrer' : undefined}
    >
      {variant === 'link' && <SvgLink className='flex-shrink-0' />}
      {children}
    </a>
  );
}
