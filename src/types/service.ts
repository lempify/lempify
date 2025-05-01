export type ServiceType = "php" | "nginx" | "mysql";

export type ServiceStatus = {
  name: ServiceType;
  installed: boolean;
  version?: string;
  running: boolean;
};

export type Statuses = "idle" | "pending" | "success" | "error" | "fixed";

export type InvokeStatus = null | "pending" | "success" | "error";

export type SiteCreatePayload = {
  name: string;
  tld?: string; // defaults to "test"
  phpVersion?: string; // future
  withWordPress?: boolean; // future
  withSSL?: boolean; // future
};

export type SiteInfo = {
  name: string;
  domain: string;
  exists: boolean;
  in_hosts: boolean;
  config_path: string;
  is_ssl: boolean;
};
