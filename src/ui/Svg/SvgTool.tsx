import Svg from './Svg';

export default function SvgTool({
  size,
  ...props
}: React.SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <Svg viewBox='0 0 20 20' xmlSpace='preserve' size={size} {...props}>
      <path
        d='M0 0v20h20zm1 2.416L17.584 19H15v-1h-1v1h-1.002v-1H12v1h-1v-1h-1v1H9v-1H8v1H7v-1H6v1H5v-1H4v1H3v-1H2v1H1zm3 7.242V16h6.344zm1 2.414L7.928 15H5z'
        
        fill='currentColor'
      />
    </Svg>
  );
}
