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
    <div className="flex items-center gap-2 text-sm">
      <span className={`w-2 h-2 rounded-full ${running ? 'bg-green-500' : 'bg-red-500'}`} />
      {name}
      {/* <Icon /> */}
    </div>
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
        return "Fixed ✅";
      case "error":
        return "Failed ❌";
      default:
        return "Idle";
    }
  };

  return (
    <li>
      <ServiceStatusIcon name={service.name} running={service.running} />
      {/* <p>
        <strong>Status:</strong>{" "}
        {service.installed ? "✅ Installed" : "❌ Not Installed"} /{" "}
        {service.running ? "🟢 Running" : "🔴 Not Running"}
      </p>

      <p>
        <strong>Repair:</strong> {renderRepairLabel()}
      </p>

      <div className="actions">
        <Button onClick={onInstall}>Install</Button>
        <Button onClick={fetchStatus}>Refresh</Button>
        <Button onClick={onStart}>Start</Button>
        <Button onClick={onStop}>Stop</Button>
        <Button onClick={handleRepair} disabled={repairStatus === "pending"}>
          Repair
        </Button>
      </div>

      <div className="overflow-auto" style={{ marginTop: "1rem" }}>{JSON.stringify(service, null, 2)}</div> */}
    </li>
  );
};

export default ServicesService;
