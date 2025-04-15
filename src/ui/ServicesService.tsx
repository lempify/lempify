import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { RepairStatus, ServiceCardProps } from "../types";
import Button from "./Button";
import SvgNginx from "./SvgNginx";
import SvgMysql from "./SvgMysql";
import SvgPhp from "./SvgPhp";

const icons = {
  nginx: SvgNginx,
  mysql: SvgMysql,
  php: SvgPhp,
};

const ServiceStatusIcon = ({ name, running }: { name: string; running: boolean }) => {
  const Icon = icons[name as keyof typeof icons];
  return (
    <p className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-300">
      <span className={`w-2 h-2 rounded-full ${running ? 'bg-green-500' : 'bg-red-500'}`} />
      <span>{name}</span>
      {/* <Icon /> */}
    </p>
  );
};

const ServicesService = ({
  service,
  icon,
  onInstall,
  fetchStatus,
  onStart,
  onStop
}: ServiceCardProps<typeof icons>) => {
  const [repairStatus, setRepairStatus] = useState<RepairStatus>("idle");

  // Handle repair effect and auto-reset
  useEffect(() => {
    if (repairStatus === "pending") {
      invoke("repair_service", { service: service.name })
        .then(() => setRepairStatus("fixed"))
        .catch(() => setRepairStatus("error"));
    }

    if (repairStatus === "fixed" || repairStatus === "error") {
      const timeout = setTimeout(() => setRepairStatus("idle"), 3000);
      return () => clearTimeout(timeout);
    }
  }, [repairStatus, service.name]);

  const handleRepair = () => {
    if (repairStatus === "idle") {
      setRepairStatus("pending");
    }
  };

  const renderRepairLabel = () => {
    switch (repairStatus) {
      case "pending":
        return "Repairing...";
      case "fixed":
        return "Repaired!";
      case "error":
        return "Failed";
      case "idle":
        return "Repair";
      default:
        return "Idle";
    }
  };

  return (
    <li className="inline-block ml-2 p4">
      <ServiceStatusIcon name={service.name} running={service.running} />
      {!service.installed && <Button className="text-xs" onClick={onInstall}>Install</Button>}
      {service.installed && !service.running && <Button className="text-xs" onClick={onStart}>Start</Button>}
      {service.running && <Button className="text-xs" onClick={onStop}>Stop</Button>}
      <Button className="text-xs" onClick={handleRepair} disabled={repairStatus === "pending"}>
        <span className={`w-2 h-2 rounded-full ${repairStatus === "pending" ? 'bg-yellow-500' : repairStatus === "fixed" ? 'bg-green-500' : 'bg-red-500'}`} /> {renderRepairLabel()}
      </Button>
      <Button className="text-xs" onClick={fetchStatus}>Restart Service</Button>
    </li>
  );
};

export default ServicesService;
