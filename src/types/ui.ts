import { ServiceStatus } from "./service";

export type ServiceCardProps<T extends Record<string, React.ComponentType>> = {
  service: ServiceStatus;
  icon: keyof T;
  onInstall: () => void;
  onStart: () => void;
  onStop: () => void;
  fetchStatus: () => void;
};
