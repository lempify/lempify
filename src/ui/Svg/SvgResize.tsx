import Svg from './Svg';

/**
 * @link https://gitlab.com/gitlab-org/gitlab-svgs?ref=iconduck.com
 */
export default function SvgPlus({
  size,
  ...props
}: React.SVGProps<SVGSVGElement> & { size?: number | Array<number> }) {
  return (
    <Svg viewBox='0 0 15 15' xmlSpace='preserve' size={size} {...props}>
      <path d="M10 2a2 2 0 1 1-3.999.001A2 2 0 0 1 10 2m0 6a2 2 0 1 1-3.999.001A2 2 0 0 1 10 8m0 6a2 2 0 1 1-3.999.001A2 2 0 0 1 10 14" fill="currentColor"/>
    </Svg>
  );
}
