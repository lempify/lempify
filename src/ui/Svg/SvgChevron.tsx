import Svg from './Svg';

const directions = {
  up: 'm8 4-6.32 6.32L3.35 12 8 7.35 12.65 12l1.67-1.68z',
  down: 'M8 12 1.68 5.68 3.35 4 8 8.65 12.65 4l1.67 1.68z',
  left: 'm4 8 6.32-6.32L12 3.35 7.35 8 12 12.65l-1.68 1.67z',
  right: 'M12 8 5.68 1.68 4 3.35 8.65 8 4 12.65l1.68 1.67z',
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
      viewBox='0 0 16 16'
      xmlSpace='preserve'
      size={size}
      {...props}
    >
      <path
        d={d}
        fill='currentColor'
      />
    </Svg>
  );
}
