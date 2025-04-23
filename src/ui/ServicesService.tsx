import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { RepairStatus, ServiceCardProps } from "../types";
import Button from "./Button";
import SvgNginx from "./ServicesSvgNginx";
import SvgMysql from "./ServicesSvgMysql";
import SvgPhp from "./ServicesSvgPhp";
import { useService } from "../context/ServicesProvider";

const icons = {
  nginx: SvgNginx,
  mysql: SvgMysql,
  php: SvgPhp,
};

const ServicesStatusIcon = ({ name, running }: { name: string; running: boolean }) => {
  const Icon = icons[name as keyof typeof icons];
  return (
    <p className="flex items-center mb-2 gap-2 text-sm text-neutral-700 dark:text-neutral-300">
      <span className={`w-2 h-2 rounded-full ${running ? 'bg-green-500' : 'bg-red-500'}`} />
      <span>{name}</span>
      <span className="ml-auto">
        <Icon />
      </span>
    </p>
  );
};

const ServicesService = ({
  service,
}: ServiceCardProps) => {
  const [repairStatus, setRepairStatus] = useState<RepairStatus>("idle");

  const { install, start, stop, restart, serviceRequestStatus } = useService(service.name);

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

  const btnCss = 'text-neutral-700 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 rounded-lg text-xs px-1 py-0.5 dark:bg-gray-800 dark:text-neutral-300 dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700';

  return (
    <li className={`inline-block p-2 ${serviceRequestStatus === "pending" ? 'animate-pulse duration-200 pointer-events-none' : ''}`}>
      <ServicesStatusIcon name={service.name } running={service.running} />
      <div className="flex gap-[1px]">
        {!service.installed ? <Button className={btnCss} onClick={() => install(service.name)}>Install</Button> : <>
          {service.installed && !service.running && <Button className={btnCss} onClick={() => start(service.name)}>Start</Button>}
          {service.running && <Button className={btnCss} onClick={() => stop(service.name)}>Stop</Button>}
          <Button className={btnCss} onClick={handleRepair} disabled={repairStatus === "pending"}>
            <span className={`w-2 h-2 rounded-full ${repairStatus === "pending" ? 'bg-yellow-500' : repairStatus === "fixed" ? 'bg-green-500' : 'bg-red-500'}`} /> {renderRepairLabel()}
          </Button>
          <Button className={btnCss} onClick={() => restart(service.name)}>Restart Service</Button>
        </>}
      </div>
    </li>
  );
};

export default ServicesService;
