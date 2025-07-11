import Svg from './Svg';

const directions = {
  up: 'M2 8l4-4 4 4',
  down: 'M2 4l4 4 4-4',
  left: 'M8 2l-4 4-4-4',
  right: 'M4 2l4 4 4-4',
};

export default function SvgChevron({
  size,
  direction = 'right',
  ...props
}: React.SVGProps<SVGSVGElement> & {
  direction?: 'up' | 'down' | 'left' | 'right';
  size?: number;
}) {
  const d = directions[direction];
  return (
    <Svg
      viewBox='0 0 12 12'
      xmlSpace='preserve'
      size={size}
      {...props}
    >
      <path
        d={d}
        fill='none'
        stroke='currentColor'
      />
    </Svg>
  );
}
