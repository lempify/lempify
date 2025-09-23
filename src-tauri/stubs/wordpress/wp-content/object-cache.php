<?php
/**
 * Lempify Object Cache Drop-in
 */

defined('ABSPATH') || exit;

/** -----------------------------------------------------------------
 * Config & Defaults (prefer WP constants + your wp-config.php)
 * ----------------------------------------------------------------- */
if (!defined('LEMPIFY_OBJECT_CACHE')) {
    define('LEMPIFY_OBJECT_CACHE', 'none');
}

if (!defined('LEMPIFY_CACHE_FAILOVER')) {
    // 'soft' (graceful no-op), 'hard' (throw), 'auto' (try other backend)
    define('LEMPIFY_CACHE_FAILOVER', 'soft');
}

if (!defined('LEMPIFY_CACHE_DEFAULT_TTL')) {
    define('LEMPIFY_CACHE_DEFAULT_TTL', 3600);
}

/** -----------------------------------------------------------------
 * Bootstrap: load base & backend
 * ----------------------------------------------------------------- */
$lempify_dir = WP_CONTENT_DIR . '/mu-plugins/lempify';
$base_file   = $lempify_dir . '/object-cache.php';
$redis_file  = $lempify_dir . '/object-cache-redis.php';
$mc_file     = $lempify_dir . '/object-cache-memcached.php';

if (!is_readable($base_file)) {
    // Cannot proceed; emulate core no-op cache to avoid hard fatal.
    if (defined('WP_DEBUG') && WP_DEBUG) {
        error_log('[Lempify OC] Base file missing: ' . $base_file);
    }
    require_once ABSPATH . WPINC . '/cache.php'; // fallback to core in-memory (if available)
    exit;
}

require_once $base_file;

$selected = strtolower((string) LEMPIFY_OBJECT_CACHE);
$loaded   = false;
$errors   = [];

/**
 * Try to load a backend class by file + class name,
 * returning instance or null if connection/bootstrap fails.
 */
$__lempify_try_backend = function (string $file, string $class) use (&$errors) {
    if (!is_readable($file)) {
        $errors[] = "[Lempify OC] Backend file not found: $file";
        return null;
    }
    require_once $file;
    if (!class_exists($class)) {
        $errors[] = "[Lempify OC] Backend class missing: $class";
        return null;
    }
    try {
        $obj = new $class();
        $obj->init();
        return $obj;
    } catch (Throwable $e) {
        $errors[] = '[Lempify OC] Backend init failed for ' . $class . ': ' . $e->getMessage();
        return null;
    }
};

global $wp_object_cache;

switch ($selected) {
    case 'redis':
        $wp_object_cache = $__lempify_try_backend($redis_file, 'Lempify_Object_Cache_Redis');
        $loaded = (bool) $wp_object_cache;
        if (!$loaded && LEMPIFY_CACHE_FAILOVER === 'auto') {
            $wp_object_cache = $__lempify_try_backend($mc_file, 'Lempify_Object_Cache_Memcached');
            $loaded = (bool) $wp_object_cache;
        }
        break;

    case 'memcached':
        $wp_object_cache = $__lempify_try_backend($mc_file, 'Lempify_Object_Cache_Memcached');
        $loaded = (bool) $wp_object_cache;
        if (!$loaded && LEMPIFY_CACHE_FAILOVER === 'auto') {
            $wp_object_cache = $__lempify_try_backend($redis_file, 'Lempify_Object_Cache_Redis');
            $loaded = (bool) $wp_object_cache;
        }
        break;

    case 'none':
        // Intentionally do not load a remote cache. Fall through to soft no-op via base.
        $wp_object_cache = new Lempify_Noop_Object_Cache();
        $wp_object_cache->init();
        $loaded = true;
        break;

    default:
        $errors[] = '[Lempify OC] Invalid LEMPIFY_OBJECT_CACHE: ' . $selected;
        $loaded = false;
        break;
}

if (!$loaded) {
    if (LEMPIFY_CACHE_FAILOVER === 'hard') {
        wp_die("Object cache initialization failed.\n" . implode("\n", $errors));
    }
    // Soft: no-op cache (in-memory array) to keep site running.
    if (defined('WP_DEBUG') && WP_DEBUG) {
        foreach ($errors as $err) { error_log($err); }
        error_log('[Lempify OC] Falling back to no-op array cache.');
    }
    $wp_object_cache = new Lempify_Noop_Object_Cache();
    $wp_object_cache->init();
}

/** -----------------------------------------------------------------
 * WordPress cache API shims
 * ----------------------------------------------------------------- */

function wp_cache_init() {
    // $wp_object_cache is constructed above. Nothing to do.
    return true;
}

function wp_cache_close() {
    global $wp_object_cache;
    if (method_exists($wp_object_cache, 'close')) {
        $wp_object_cache->close();
    }
    return true;
}

function wp_cache_add($key, $data, $group = '', $expire = 0) {
    return $GLOBALS['wp_object_cache']->add($key, $data, $group, $expire);
}

function wp_cache_set($key, $data, $group = '', $expire = 0) {
    return $GLOBALS['wp_object_cache']->set($key, $data, $group, $expire);
}

function wp_cache_replace($key, $data, $group = '', $expire = 0) {
    return $GLOBALS['wp_object_cache']->replace($key, $data, $group, $expire);
}

function wp_cache_get($key, $group = '', $force = false, &$found = null) {
    return $GLOBALS['wp_object_cache']->get($key, $group, $force, $found);
}

function wp_cache_get_multiple($keys, $group = '', $force = false) {
    return $GLOBALS['wp_object_cache']->get_multiple($keys, $group, $force);
}

function wp_cache_delete($key, $group = '') {
    return $GLOBALS['wp_object_cache']->delete($key, $group);
}

function wp_cache_incr($key, $offset = 1, $group = '') {
    return $GLOBALS['wp_object_cache']->incr($key, $offset, $group);
}

function wp_cache_decr($key, $offset = 1, $group = '') {
    return $GLOBALS['wp_object_cache']->decr($key, $offset, $group);
}

function wp_cache_flush() {
    return $GLOBALS['wp_object_cache']->flush();
}

function wp_cache_add_global_groups($groups) {
    return $GLOBALS['wp_object_cache']->add_global_groups($groups);
}

function wp_cache_add_non_persistent_groups($groups) {
    return $GLOBALS['wp_object_cache']->add_non_persistent_groups($groups);
}
