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

const ServiceDashboard = () => {
    const [services, setServices] = useState<Record<string, ServiceStatus>>({});

    const handleStart = async (service: ServiceType) => {
        try {
            const updatedStatus = await invoke<ServiceStatus>("start_service", { service });
            setServices({ ...services, [service]: updatedStatus });
        } catch (err) {
            console.error("Start failed:", err);
        }
    };

    const handleStop = async (service: ServiceType) => {
        try {
            const updatedStatus = await invoke<ServiceStatus>("stop_service", { service });
            setServices({ ...services, [service]: updatedStatus });
        } catch (err) {
            console.error("Stop failed:", err);
        }
    };

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
                    onStart={() => handleStart(service)}
                    onStop={() => handleStop(service)}
                    fetchStatus={() => getServiceStatus(service)}
                />
            ))}
        </div>
    );
};

export default ServiceDashboard;