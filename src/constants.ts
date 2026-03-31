export const DEFAULT_SITE_TYPE = 'wordpress';

export const DEFAULT_PHP_VERSION = '8.4';

export const PHP_SUPPORTED_VERSIONS = ['8.5', '8.4', '8.3', '8.2', '8.1', '8.0'] as const;

const DEFAULT_DEPENDENCY = {
  name: '',
  isRequired: false,
  humanName: '',
  lastError: '',
};

// PHP services are intentionally absent here — they are registered dynamically
// in LempifydContext as the daemon reports which versions are in use (one entry
// per "php@{version}" key received from the daemon).
export const SERVICES = {
  nginx: {
    ...DEFAULT_DEPENDENCY,
    name: 'nginx',
    isRequired: true,
    humanName: 'Nginx',
  },
  mysql: {
    ...DEFAULT_DEPENDENCY,
    name: 'mysql',
    isRequired: true,
    humanName: 'MySQL',
  },
  memcached: {
    ...DEFAULT_DEPENDENCY,
    name: 'memcached',
    isRequired: false,
    humanName: 'Memcached',
  },
  redis: {
    ...DEFAULT_DEPENDENCY,
    name: 'redis',
    isRequired: false,
    humanName: 'Redis',
  },
};

export const TOOLS = {
  composer: {
    ...DEFAULT_DEPENDENCY,
    name: 'composer',
    isRequired: true,
    humanName: 'Composer',
  },
  mkcert: {
    ...DEFAULT_DEPENDENCY,
    name: 'mkcert',
    isRequired: true,
    humanName: 'mkcert',
  },
  mailpit: {
    ...DEFAULT_DEPENDENCY,
    name: 'mailpit',
    isRequired: false,
    humanName: 'Mailpit',
  },
  'wp-cli': {
    ...DEFAULT_DEPENDENCY,
    name: 'wp-cli',
    isRequired: false,
    humanName: 'WP-CLI',
  },
};
