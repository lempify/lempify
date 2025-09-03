export type SiteInfo = {
  name: string;
  domain: string;
  exists: boolean;
  in_hosts: boolean;
  config_path: string;
  is_ssl: boolean;
};

export type Site = {
  name: string;
  domain: string;
  ssl: boolean;
  services: {
    php: string;
    mysql: string;
    nginx: string;
    redis: string;
    memcached: string;
  };
  site_type: string;
  language: string;
  database: string;
  site_config: {
    ssl: boolean;
    root: string;
    logs: string;
    ssl_key: string;
    ssl_cert: string;
  };
  path: string;
};
