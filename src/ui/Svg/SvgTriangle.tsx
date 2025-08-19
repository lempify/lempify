import Svg from './Svg';

export default function SvgTriangle({
  size,
  direction = 'left',
  ...props
}: React.SVGProps<SVGSVGElement> & {
  size?: number;
  direction?: 'left' | 'right' | 'up' | 'down';
}) {
  const style = {
    transform:
      direction === 'left'
        ? 'rotate(-90deg)'
        : direction === 'right'
          ? 'rotate(90deg)'
          : direction === 'up'
            ? 'rotate(0)'
            : 'rotate(180deg)',
  };
  return (
    <Svg
      viewBox='0 0 16 16'
      xmlSpace='preserve'
      style={style}
      size={size}
      {...props}
    >
      <path fill='currentColor' d='M8 2 2 14h12Zm0 4.875 2.438 4.875H5.586Z' />
    </Svg>
  );
}
