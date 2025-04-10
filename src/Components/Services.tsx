import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { ServiceCard } from "./ServiceCard";
import { ServiceStatus, ServiceType } from "./types";

const serviceList: ServiceType[] = ["php", "nginx", "mysql"];

const getServiceStatus = async (service: ServiceType): Promise<ServiceStatus> => {
    return await invoke("get_service_status", { service });
};

const installService = async (service: ServiceType): Promise<string> => {
    return await invoke("install_service", { service });
};

const startService = async (service: ServiceType): Promise<string> => {
    try {
        const state = await invoke("start_service", { service });
        console.log(state);
        return state as string;
    } catch (error) {
        console.error(error);
        return "Failed to start service";
    }
};

const stopService = async (service: ServiceType): Promise<string> => {
    try {
        const state = await invoke("stop_service", { service });
        console.log(state);
        return state as string;
    } catch (error) {
        console.error(error);
        return "Failed to stop service";
    }
};

const ServiceDashboard = () => {
    const [services, setServices] = useState<Record<string, ServiceStatus>>({});

    useEffect(() => {
        const checkAll = async () => {
            const statusResults = await Promise.all([
                getServiceStatus("php"),
                getServiceStatus("nginx"),
                getServiceStatus("mysql")
            ]);
            setServices({
                php: statusResults[0],
                nginx: statusResults[1],
                mysql: statusResults[2]
            });
        };
        checkAll();
    }, []);

    return (
        <div>
            {serviceList.map((service) => (
                <ServiceCard
                    key={service}
                    service={service}
                    status={services[service] ?? {
                        name: service,
                        installed: false,
                        version: null,
                        running: false
                    }}
                    onInstall={() => installService(service)}
                    onStart={() => startService(service)}
                    onStop={() => stopService(service)}
                    fetchStatus={() => getServiceStatus(service)}
                />
            ))}
        </div>
    );
};

export default ServiceDashboard;