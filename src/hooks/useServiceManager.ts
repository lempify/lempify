import { useEffect, useState } from "react";
import { useInvoke } from "./useInvoke";
import { ServiceStatus, ServiceType } from "../types";

const serviceList: ServiceType[] = ["php", "nginx", "mysql"];

const defaultServiceStatus: ServiceStatus = {
  name: null,
  installed: false,
  version: undefined,
  running: false
};

export function useServiceManager() {
  const [services, setServices] = useState<Record<ServiceType, ServiceStatus>>({
    php: { ...defaultServiceStatus, name: "php" },
    nginx: { ...defaultServiceStatus, name: "nginx" },
    mysql: { ...defaultServiceStatus, name: "mysql" }
  });

  const { invoke } = useInvoke();

  const updateStatus = async (service: ServiceType) => {
    const { data } = await invoke<ServiceStatus>("get_service_status", { service });
    if (data) {
      setServices(prev => ({ ...prev, [service]: data }));
    }
  };

  const updateAllStatuses = async () => {
    for (const service of serviceList) {
      await updateStatus(service);
    }
  };

  const install = async (service: ServiceType) => {
    const { error } = await invoke("install_service", { service });
    if (!error) await updateStatus(service);
  };

  const start = async (service: ServiceType) => {
    const { data } = await invoke<ServiceStatus>("start_service", { service });
    if (data) setServices(prev => ({ ...prev, [service]: data }));
  };

  const stop = async (service: ServiceType) => {
    const { data } = await invoke<ServiceStatus>("stop_service", { service });
    if (data) setServices(prev => ({ ...prev, [service]: data }));
  };

  useEffect(() => {
    updateAllStatuses();
  }, []);

  const servicesValues = Object.values(services);

  return {
    services,
    servicesValues: servicesValues,
    servicesStatuses: { 
      active: servicesValues.filter(service => service.running), 
      inactive: servicesValues.filter(service => !service.running) 
    },
    install,
    start,
    stop,
    refresh: updateStatus
  };
}
