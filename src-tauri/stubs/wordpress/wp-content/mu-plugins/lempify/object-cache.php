<?php
/**
 * Lempify Base Object Cache
 *
 * Backends should extend WP_Object_Cache and implement the storage ops.
 */

defined('ABSPATH') || exit;

/**
 * Normalize group lists via filters and constants.
 */
function lempify_cache_default_global_groups() {
    $defaults = array(
        'users', 'userlogins', 'usermeta',
        'site-transient', 'site-options',
        'blog-details', 'blog-id-cache',
        'networks', 'sites', 'site-details', 'blog-lookup',
        'global-posts', 'blog_meta',
    );
    // Allow user to add extras via constant.
    if (defined('LEMPIFY_GLOBAL_GROUPS')) {
        $extra = @unserialize(LEMPIFY_GLOBAL_GROUPS);
        if (is_array($extra)) {
            $defaults = array_unique(array_merge($defaults, $extra));
        }
    }
    return apply_filters('lempify_global_cache_groups', $defaults);
}

function lempify_cache_default_non_persistent_groups() {
    $defaults = array(
        'counts', 'plugins', 'comment',
    );
    if (defined('LEMPIFY_NON_PERSISTENT_GROUPS')) {
        $extra = @unserialize(LEMPIFY_NON_PERSISTENT_GROUPS);
        if (is_array($extra)) {
            $defaults = array_unique(array_merge($defaults, $extra));
        }
    }
    return apply_filters('lempify_non_persistent_cache_groups', $defaults);
}

/**
 * Base: our override of WP_Object_Cache (required by WP drop-in contract).
 * Concrete backends (Redis/Memcached) extend this and implement the adapter methods.
 */
class WP_Object_Cache {

    /** @var array in-request runtime cache */
    protected $cache = array();

    /** @var array groups that are not persisted remotely */
    protected $no_remote_groups = array();

    /** @var array groups that are treated as global (no blog id suffix) */
    protected $global_groups = array();

    /** @var string Key prefix for isolation */
    protected $prefix = '';

    /** @var int Current blog id (for multisite scoping) */
    protected $blog_id = 0;

    /** @var bool */
    protected $multisite = false;

    /** @var int Default TTL seconds */
    protected $default_ttl = LEMPIFY_CACHE_DEFAULT_TTL;

    /** @var bool Guard against cache addition when suspended */
    protected $suspend_addition = false;

    public function __construct() {}

    /**
     * Called by drop-in after instantiation.
     */
    public function init() {
        $this->multisite = function_exists('is_multisite') ? is_multisite() : false;
        $this->blog_id   = $this->multisite && function_exists('get_current_blog_id')
            ? (int) get_current_blog_id()
            : 0;

        $this->global_groups      = lempify_cache_default_global_groups();
        $this->no_remote_groups   = lempify_cache_default_non_persistent_groups();
        $this->prefix             = $this->build_prefix();
        $this->suspend_addition   = (function_exists('wp_suspend_cache_addition') && wp_suspend_cache_addition());

        // Let backends connect if they need to
        if (method_exists($this, 'connect')) {
            $this->connect();
        }
    }

    protected function build_prefix() {
        if (defined('LEMPIFY_CACHE_PREFIX') && LEMPIFY_CACHE_PREFIX) {
            $salt = LEMPIFY_CACHE_PREFIX;
        } elseif (defined('WP_CACHE_KEY_SALT') && WP_CACHE_KEY_SALT) {
            $salt = WP_CACHE_KEY_SALT;
        } else {
            // WP-native pieces for a stable default salt.
            $db = defined('DB_NAME') ? DB_NAME : 'wp';
            $tp = isset($GLOBALS['table_prefix']) ? $GLOBALS['table_prefix'] : 'wp_';
            $site = (string) (defined('SITE_URL') ? SITE_URL : (function_exists('get_site_url') ? get_site_url(0, '/', 'http') : ''));
            $salt = $db . ':' . $tp . ':' . parse_url($site, PHP_URL_HOST);
        }

        $blog = $this->multisite ? ':' . $this->blog_id : '';
        return 'lempify:' . $salt . $blog . ':';
    }

    protected function group_key($key, $group) {
        $group = $group ?: 'default';
        if (in_array($group, $this->global_groups, true)) {
            $scope = $this->prefix; // prefix already includes site salt; omit blog id effect by reusing salt only
        } else {
            $scope = $this->prefix;
        }

        $id = $scope . $group . ':' . $key;

        // Memcached limit: 250 bytes. Redis is fine but we’ll keep parity.
        if (strlen($id) > 230) {
            $hash = md5($id);
            $id = substr($id, 0, 200) . ':h:' . $hash;
        }
        return array($id, $group);
    }

    protected function clamp_ttl($ttl) {
        $ttl = (int) $ttl;
        if ($ttl <= 0) $ttl = $this->default_ttl;
        if (defined('LEMPIFY_CACHE_MAX_TTL') && LEMPIFY_CACHE_MAX_TTL > 0) {
            $ttl = min($ttl, (int) LEMPIFY_CACHE_MAX_TTL);
        }
        return $ttl;
    }

    /** ---------------------
     * WordPress API methods
     * --------------------- */

    public function add($key, $data, $group = 'default', $expire = 0) {
        if ($this->suspend_addition) {
            return false;
        }
        $found = null;
        $this->get($key, $group, false, $found);
        if ($found) {
            return false;
        }
        return $this->set($key, $data, $group, $expire);
    }

    public function replace($key, $data, $group = 'default', $expire = 0) {
        $found = null;
        $this->get($key, $group, false, $found);
        if (!$found) {
            return false;
        }
        return $this->set($key, $data, $group, $expire);
    }

    public function set($key, $data, $group = 'default', $expire = 0) {
        list($id, $grp) = $this->group_key($key, $group);
        $ttl = $this->clamp_ttl($expire);

        // runtime cache for request
        $this->cache[$grp][$id] = $data;

        if (in_array($grp, $this->no_remote_groups, true)) {
            return true;
        }
        return $this->storage_set($id, $data, $ttl);
    }

    public function get($key, $group = 'default', $force = false, &$found = null) {
        list($id, $grp) = $this->group_key($key, $group);

        if (!$force && isset($this->cache[$grp][$id])) {
            $found = true;
            return $this->cache[$grp][$id];
        }

        if (in_array($grp, $this->no_remote_groups, true)) {
            $found = isset($this->cache[$grp][$id]);
            return $found ? $this->cache[$grp][$id] : false;
        }

        $val = $this->storage_get($id, $hit);
        if ($hit) {
            $this->cache[$grp][$id] = $val;
            $found = true;
            return $val;
        }
        $found = false;
        return false;
    }

    public function get_multiple($keys, $group = 'default', $force = false) {
        $out = array();
        $miss_ids = array();
        $map = array(); // id => original key

        foreach ((array)$keys as $k) {
            list($id, $grp) = $this->group_key($k, $group);
            $map[$id] = $k;

            if (!$force && isset($this->cache[$grp][$id])) {
                $out[$k] = $this->cache[$grp][$id];
                continue;
            }

            if (in_array($grp, $this->no_remote_groups, true)) {
                $out[$k] = isset($this->cache[$grp][$id]) ? $this->cache[$grp][$id] : false;
                continue;
            }

            $miss_ids[$grp][] = $id;
        }

        if (!empty($miss_ids)) {
            foreach ($miss_ids as $grp => $ids) {
                $batch = $this->storage_get_multi($ids);
                foreach ($ids as $id) {
                    if (array_key_exists($id, $batch)) {
                        $val = $batch[$id];
                        $this->cache[$grp][$id] = $val;
                        $out[$map[$id]] = $val;
                    } else {
                        $out[$map[$id]] = false;
                    }
                }
            }
        }

        return $out;
    }

    public function delete($key, $group = 'default') {
        list($id, $grp) = $this->group_key($key, $group);
        unset($this->cache[$grp][$id]);
        if (in_array($grp, $this->no_remote_groups, true)) {
            return true;
        }
        return $this->storage_delete($id);
    }

    public function incr($key, $offset = 1, $group = 'default') {
        list($id, $grp) = $this->group_key($key, $group);
        $offset = (int) $offset;

        if (in_array($grp, $this->no_remote_groups, true)) {
            $cur = isset($this->cache[$grp][$id]) ? (int)$this->cache[$grp][$id] : 0;
            $cur += $offset;
            $this->cache[$grp][$id] = $cur;
            return $cur;
        }

        $val = $this->storage_incr($id, $offset);
        if ($val !== false) {
            $this->cache[$grp][$id] = (int)$val;
        }
        return $val;
    }

    public function decr($key, $offset = 1, $group = 'default') {
        return $this->incr($key, -abs((int)$offset), $group);
    }

    public function flush() {
        $this->cache = array();
        return $this->storage_flush();
    }

    public function add_global_groups($groups) {
        $groups = (array) $groups;
        $this->global_groups = array_unique(array_merge($this->global_groups, $groups));
    }

    public function add_non_persistent_groups($groups) {
        $groups = (array) $groups;
        $this->no_remote_groups = array_unique(array_merge($this->no_remote_groups, $groups));
    }

    public function switch_to_blog($blog_id) {
        $this->blog_id = (int) $blog_id;
        $this->prefix  = $this->build_prefix();
    }

    public function close() {
        if (method_exists($this, 'disconnect')) {
            $this->disconnect();
        }
    }

    /** ---------------------
     * Storage adapter surface
     * Backends must implement these. Return booleans where noted.
     * --------------------- */
    protected function connect() {}
    protected function disconnect() {}
    protected function storage_set($id, $value, $ttl) { return false; }
    protected function storage_get($id, &$hit = null) { $hit = false; return false; }
    protected function storage_get_multi(array $ids) { return array(); }
    protected function storage_delete($id) { return false; }
    protected function storage_incr($id, $offset) { return false; }
    protected function storage_flush() { return false; }
}

/**
 * No-op in-memory fallback (safe soft mode).
 */
class Lempify_Noop_Object_Cache extends WP_Object_Cache {
    protected function storage_set($id, $value, $ttl) { return true; }
    protected function storage_get($id, &$hit = null) { $hit = false; return false; }
    protected function storage_get_multi(array $ids) { return array(); }
    protected function storage_delete($id) { return true; }
    protected function storage_incr($id, $offset) { return 0; }
    protected function storage_flush() { return true; }
}
