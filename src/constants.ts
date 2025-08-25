export const DEFAULT_SITE_TYPE = 'wordpress';

const DEFAULT_DEPENDENCY = {
  name: '',
  isRequired: false,
  humanName: '',
  lastError: '',
};

export const SERVICES = {
  php: { ...DEFAULT_DEPENDENCY, name: 'php', isRequired: true, humanName: 'PHP' },
  nginx: { ...DEFAULT_DEPENDENCY, name: 'nginx', isRequired: true, humanName: 'Nginx' },
  mysql: { ...DEFAULT_DEPENDENCY, name: 'mysql', isRequired: true, humanName: 'MySQL' },
  memcached: { ...DEFAULT_DEPENDENCY, name: 'memcached', isRequired: false, humanName: 'Memcached' },
  redis: { ...DEFAULT_DEPENDENCY, name: 'redis', isRequired: false, humanName: 'Redis' },
};

export const TOOLS = {
  composer: { ...DEFAULT_DEPENDENCY, name: 'composer', isRequired: true, humanName: 'Composer' },
  mkcert: { ...DEFAULT_DEPENDENCY, name: 'mkcert', isRequired: true, humanName: 'mkcert' },
  mailpit: { ...DEFAULT_DEPENDENCY, name: 'mailpit', isRequired: false, humanName: 'Mailpit' },
  'wp-cli': { ...DEFAULT_DEPENDENCY, name: 'wp-cli', isRequired: false, humanName: 'WP-CLI' },
};
