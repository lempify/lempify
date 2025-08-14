import Svg from './Svg';

export default function SvgSuccess({
  size,
  ...props
}: React.SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <Svg viewBox='0 0 16 16' xmlSpace='preserve' size={size} {...props}>
      <path d="M8 2a6 6 0 0 0-6 6 6 6 0 0 0 6 6 6 6 0 0 0 6-6 6 6 0 0 0-6-6m3.126 2.828.835.835-5.141 5.14-2.78-2.778.836-.837L6.82 9.132z" fill="currentColor"/>
    </Svg>
  );
}
