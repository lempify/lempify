import { ServiceStatus } from "./service";

export type ServiceCardProps = {
  service: ServiceStatus;
};

export interface ServiceIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  viewBox?: string;
  className?: string;
}