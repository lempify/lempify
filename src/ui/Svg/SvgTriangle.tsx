import Svg from './Svg';

export default function SvgTriangle({
  size,
  ...props
}: React.SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <Svg viewBox='0 0 16 16' xmlSpace='preserve' size={size} {...props}>
      <path fill='currentColor' d='M8 2 2 14h12Zm0 4.875 2.438 4.875H5.586Z' />
    </Svg>
  );
}
