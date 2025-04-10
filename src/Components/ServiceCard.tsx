import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { RepairStatus, ServiceCardProps } from "./types";

export const ServiceCard = ({ service, status, onInstall, fetchStatus, onStart, onStop }: ServiceCardProps) => {
    const [repairStatus, setRepairStatus] = useState<RepairStatus>("idle");

    useEffect(() => {
        if (repairStatus === "fixed" || repairStatus === "error") {
            const timeout = setTimeout(() => setRepairStatus("idle"), 3000);
            return () => clearTimeout(timeout);
        }
    }, [repairStatus]);

    useEffect(() => {
        if (repairStatus === "pending") {
            invoke("repair_service", { service })
                .then(() => setRepairStatus("fixed"))
                .catch(() => setRepairStatus("error"));
        }
    }, [repairStatus, service]);

    const repairService = () => {
        setRepairStatus("pending");
    };

    return (
        <div>
            <h1>{service}</h1>
            <p>{status.installed ? "Installed" : "Not Installed"} / {status.running ? "Running" : "Not Running"} </p>
            {{
                idle: "Idle",
                pending: "Repairing...",
                fixed: "Fixed ✅",
                error: "Failed ❌",
            }[repairStatus]}
            {/* <p>{status.version}</p> */}
            <button onClick={onInstall}>Install</button>
            <button onClick={fetchStatus}>Get Service Status</button>
            <button onClick={onStop}>Stop</button>
            <button onClick={onStart}>Start</button>
            <button onClick={repairService}>Repair</button>
            <pre>{JSON.stringify(status, null, 2)}</pre>
        </div>
    );
};