export interface ServiceIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | Array<number | string>;
  viewBox?: string;
  className?: string;
  responsive?: Array<Array<number | string | undefined>>;
}
