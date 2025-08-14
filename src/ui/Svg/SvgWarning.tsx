import Svg from './Svg';

export default function SvgWarning({
  size,
  ...props
}: React.SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <Svg viewBox='0 0 52 52' xmlSpace='preserve' size={size} {...props}>
      <path d="m51.4 42.5-22.9-37c-1.2-2-3.8-2-5 0L.6 42.5C-.8 44.8.6 48 3.1 48h45.8c2.5 0 4-3.2 2.5-5.5M26 40c-1.7 0-3-1.3-3-3s1.3-3 3-3 3 1.3 3 3-1.3 3-3 3m3-9c0 .6-.4 1-1 1h-4c-.6 0-1-.4-1-1V18c0-.6.4-1 1-1h4c.6 0 1 .4 1 1z" fill="currentColor"/>
    </Svg>
  );
}
