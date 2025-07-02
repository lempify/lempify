import Svg from './Svg';

export default function SvgMoon({
  size,
  ...props
}: React.SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <Svg
      viewBox='0 0 32 32'
      xmlSpace='preserve'
      fill='none'
      size={size}
      {...props}
    >
      <path
        d='M10.895 7.574c0 7.55 5.179 13.67 11.567 13.67 1.588 0 3.101-.38 4.479-1.063-1.695 4.46-5.996 7.636-11.051 7.636-6.533 0-11.83-5.297-11.83-11.83 0-4.82 2.888-8.959 7.023-10.803a16 16 0 0 0-.188 2.39'
        fill='currentColor'
      />
    </Svg>
  );
}
