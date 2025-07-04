import Svg from './Svg';

/**
 * @link https://gitlab.com/gitlab-org/gitlab-svgs?ref=iconduck.com
 */
export default function SvgShield({
  size,
  ...props
}: React.SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <Svg viewBox='0 0 16 16' xmlSpace='preserve' size={size} {...props}>
      <path
        fill='currentColor'
        d='M8,0 L15,2 L15,5.68629 C15,7.80802 14.1571,9.84285 12.6569,11.3431 L8,16 L3.34314,11.3431 C1.84285,9.84285 1,7.80802 1,5.68629 L1,2 L8,0 Z M8,2.08003 L3,3.5086 L3,5.68629 C3,7.27759 3.63214,8.80371 4.75736,9.92893 L8,13.1716 L11.2426,9.92893 C12.3679,8.80371 13,7.27759 13,5.68629 L13,3.5086 L8,2.08003 Z M8,4 L8,10.3594 L6.18269,8.55626 C5.42575,7.80523 5,6.78306 5,5.71676 L5,5 L8,4 Z'
      />
    </Svg>
  );
}
