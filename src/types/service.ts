import { SERVICES, TOOLS } from '../constants';

// Static service keys (nginx, mysql, memcached, redis).
// PHP version services (e.g. "php@8.4") are added dynamically at runtime.
export type ServiceTypes = keyof typeof SERVICES;

export type ServiceStatus = {
  name: ServiceTypes;
  installed: boolean;
  version?: string;
  running: boolean;
};

export type ToolTypes = keyof typeof TOOLS;

export type ToolStatus = {
  name: ToolTypes;
  installed: boolean;
  version?: string;
  running: boolean;
};

export type Statuses = 'idle' | 'pending' | 'success' | 'error' | 'fixed';

export type InvokeStatus = null | 'pending' | 'success' | 'error';

export type SiteCreatePayload = {
  name: string;
  tld?: string; // defaults to "test"
  phpVersion?: string;
  withWordPress?: boolean; // future
  withSSL?: boolean; // future
};
