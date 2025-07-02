import Svg from './Svg';

/**
 * @link https://www.svgrepo.com/svg/68428/computer
 */
export default function SvgSystem({
  size,
  ...props
}: React.SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <Svg
      viewBox='0 0 24 24'
      xmlSpace='preserve'
      fill='none'
      size={size}
      {...props}
    >
      <path
        d='M2 5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-7v2h3a1 1 0 1 1 0 2H8a1 1 0 1 1 0-2h3v-2H4a2 2 0 0 1-2-2zm18 11V5H4v11z'
        fill='currentColor'
      />
    </Svg>
  );
}
