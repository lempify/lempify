/**
 * Services Context for managing services
 */

import { createContext, useContext, useEffect, useState } from "react";

import { useInvoke } from "../hooks/useInvoke";
import { ServiceType, InvokeStatus } from "../types/service";

type Service = {
    name: ServiceType;
    installed: boolean;
    version?: string;
    running: boolean;
    requestStatus: InvokeStatus;
};

type Services = {
    php: Service;
    nginx: Service;
    mysql: Service;
};

type ServicesContextType = {
    services: Services;
    servicesValues: Service[];
    servicesStatuses: {
        active: Service[];
        inactive: Service[];
    };
    setServices: (services: Services) => void;
    getStatus: (service: ServiceType) => Promise<void>;
    restart: (service: ServiceType) => Promise<void>;
    install: (service: ServiceType) => Promise<void>;
    start: (service: ServiceType) => Promise<void>;
    stop: (service: ServiceType) => Promise<void>;
};

const ServicesContext = createContext<ServicesContextType | undefined>(undefined);

const defaultService: Service = {
    name: "php",
    installed: false,
    version: undefined,
    running: false,
    requestStatus: null
};

export function ServicesProvider({ children }: { children: React.ReactNode }) {
    const [services, setServices] = useState<Services>({
        php: { ...defaultService, name: "php" },
        nginx: { ...defaultService, name: "nginx" },
        mysql: { ...defaultService, name: "mysql" }
    });

    const { invoke } = useInvoke();

    useEffect(() => {
        getStatus("php");
        getStatus("nginx");
        getStatus("mysql");
    }, []);

    const handleServiceOperation = async (
        service: ServiceType,
        operation: "get_service_status" | "restart_service" | "install_service" | "start_service" | "stop_service",
        onSuccess?: (data: Service) => void
    ) => {
        setServices(prev => ({ ...prev, [service]: { ...prev[service], requestStatus: "pending" } }));
        try {
            const { data, error } = await invoke<Service>(operation, { service });
            if (error) {
                throw error;
            }

            if (data) {
                setServices(prev => ({ ...prev, [service]: data }));
                if (onSuccess) {
                    onSuccess(data);
                }
            }

            setServices(prev => ({ ...prev, [service]: { ...prev[service], requestStatus: "success" } }));
        } catch (error) {
            console.error(error);
            setServices(prev => ({ ...prev, [service]: { ...prev[service], requestStatus: "error" } }));
        }
    };

    const getStatus = async (service: ServiceType) => {
        await handleServiceOperation(service, "get_service_status");
    };

    const restart = async (service: ServiceType) => {
        await handleServiceOperation(service, "restart_service");
    };

    const install = async (service: ServiceType) => {
        await handleServiceOperation(service, "install_service", () => getStatus(service));
    };

    const start = async (service: ServiceType) => {
        await handleServiceOperation(service, "start_service");
    };

    const stop = async (service: ServiceType) => {
        await handleServiceOperation(service, "stop_service");
    };

    const servicesValues = Object.values(services);

    return <ServicesContext.Provider value={{
        services, servicesStatuses: {
            active: servicesValues.filter(service => service.running),
            inactive: servicesValues.filter(service => !service.running)
        }, servicesValues, setServices, getStatus, restart, install, start, stop
    }}>{children}</ServicesContext.Provider>;
}

export function useServices() {
    const context = useContext(ServicesContext);
    if (!context) {
        throw new Error('useServices must be used within a ServicesProvider');
    }
    return context;
}

export function useService(service: ServiceType) {
    const context = useContext(ServicesContext);
    if (!context) {
        throw new Error('useService must be used within a ServicesProvider');
    }
    return {
        service: context.services[service],
        serviceRequestStatus: context.services[service].requestStatus,
        stop: context.stop,
        start: context.start,
        restart: context.restart,
        install: context.install,
    };
}