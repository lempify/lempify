type ServiceType = "php" | "nginx" | "mysql";

type ServiceStatus = {
    name: string;
    installed: boolean;
    version?: string;
    running: boolean;
};

type RepairStatus = "idle" | "pending" | "fixed" | "error";

type ServiceCardProps = {
    service: ServiceType;
    status: ServiceStatus;
    onInstall: () => void;
    onStart: () => void;
    onStop: () => void;
    // onRepair: () => void;
    fetchStatus: () => void;
  };

export type { ServiceType, ServiceStatus, RepairStatus, ServiceCardProps };
