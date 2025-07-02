import Svg from './Svg';

/**
 * @link https://gitlab.com/gitlab-org/gitlab-svgs?ref=iconduck.com
 */
export default function SvgPlus({
  size,
  ...props
}: React.SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <Svg viewBox='0 0 1200 1200' xmlSpace='preserve' size={size} {...props}>
      <path d="M430.078 0v430.078H0v339.844h430.078V1200h339.844V769.922H1200V430.078H769.922V0z" />
    </Svg>
  );
}
