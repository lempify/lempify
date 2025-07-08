import SvgLink from './Svg/SvgLink';

export default function Anchor({
  children,
  className,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      className={`${className} flex items-center gap-2 cursor-pointer w-fit`}
      {...props}
    >
      <SvgLink className='flex-shrink-0' />
      {children}
    </a>
  );
}
