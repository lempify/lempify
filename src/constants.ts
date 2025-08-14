export const DEFAULT_SITE_TYPE = 'wordpress';

export const SERVICES = {
  php: {
    name: 'php',
    isRequired: true,
    humanName: 'PHP',
  },
  nginx: {
    name: 'nginx',
    isRequired: true,
    humanName: 'Nginx',
  },
  mysql: {
    name: 'mysql',
    isRequired: true,
    humanName: 'MySQL',
  },
  memcached: {
    name: 'memcached',
    isRequired: false,
    humanName: 'Memcached',
  },
  redis: {
    name: 'redis',
    isRequired: false,
    humanName: 'Redis',
  },
};

export const TOOLS = {
  composer: {
    name: 'composer',
    isRequired: true,
    humanName: 'Composer',
  },
  mailpit: {
    name: 'mailpit',
    isRequired: false,
    humanName: 'Mailpit',
  },
  'wp-cli': {
    name: 'wp-cli',
    isRequired: false,
    humanName: 'WP-CLI',
  },
};
