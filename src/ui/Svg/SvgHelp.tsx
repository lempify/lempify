import Svg from './Svg';

export default function SvgHelp({
  size,
  ...props
}: React.SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <Svg viewBox='0 0 24 24' xmlSpace='preserve' size={size} {...props}>
      <path fill="none" d="M0 0h24v24H0z"/><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2m1 16h-2v-2h2zm0-4.14V15h-2v-2a1 1 0 0 1 1-1c1.103 0 2-.897 2-2s-.897-2-2-2-2 .897-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4a3.99 3.99 0 0 1-3 3.86" fill="currentColor"/>
    </Svg>
  );
}
