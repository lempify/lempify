import { useInvoke } from "./useInvoke";
import { Statuses, ServiceType } from "../types/service";
import { useEffect, useRef } from "react";

const defaultServices: ServiceType[] = ["php", "nginx", "mysql"];

export default function useLempifyd(services = defaultServices) {
    const { invoke, invokeStatus } = useInvoke();
    const requests = useRef<Record<`${ServiceType}:${string}`, Statuses>>({});

    useEffect(() => {
        for (const service of services) {
            startService(service);
        }
    }, [services]);

    const startService = async (service: ServiceType) => {
        if (requests.current[`${service}:start`]) {
            return;
        }
        try {
            requests.current[`${service}:start`] = "pending";
            await invoke("lempifyd", {
                service,
                action: "start",
            });
            requests.current[`${service}:start`] = "success";
        } catch (error) {
            requests.current[`${service}:start`] = "error";
        }
    }

    return { startService, invokeStatus };
}
