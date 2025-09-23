<?php
/**
 * Lempify \Redis Object Cache (phpredis)
 */

defined('ABSPATH') || exit;

class Lempify_Object_Cache_Redis extends WP_Object_Cache {

    /** @var \Redis */
    protected $redis;

    protected function connect() {
        if (!class_exists('Redis')) {
            throw new RuntimeException('phpredis extension not installed.');
        }

        $host = defined('LEMPIFY_REDIS_HOST') ? LEMPIFY_REDIS_HOST : '127.0.0.1';
        $port = defined('LEMPIFY_REDIS_PORT') ? (int) LEMPIFY_REDIS_PORT : 6379;
        $db   = defined('LEMPIFY_REDIS_DB')   ? (int) LEMPIFY_REDIS_DB   : 0;

        $persistent = defined('LEMPIFY_REDIS_PERSISTENT') ? (bool) LEMPIFY_REDIS_PERSISTENT : true;
        $timeout    = 1.0;

        $this->redis = new \Redis();

        $ok = $persistent
            ? $this->redis->pconnect($host, $port, $timeout)
            : $this->redis->connect($host, $port, $timeout);

        if (!$ok) {
            throw new RuntimeException("\Redis connect failed {$host}:{$port}");
        }

        if (defined('LEMPIFY_REDIS_PASSWORD') && LEMPIFY_REDIS_PASSWORD !== '') {
            if (!$this->redis->auth(LEMPIFY_REDIS_PASSWORD)) {
                throw new RuntimeException('\Redis auth failed');
            }
        }

        if ($db > 0) {
            if (!$this->redis->select($db)) {
                throw new RuntimeException("\Redis select DB {$db} failed");
            }
        }

        // Serializer preference
        $serializer = defined('LEMPIFY_REDIS_SERIALIZER') ? LEMPIFY_REDIS_SERIALIZER : 'igbinary';
        if ($serializer === 'igbinary' && defined('\Redis::SERIALIZER_IGBINARY')) {
            $this->redis->setOption(\Redis::OPT_SERIALIZER, \Redis::SERIALIZER_IGBINARY);
        } else {
            $this->redis->setOption(\Redis::OPT_SERIALIZER, \Redis::SERIALIZER_PHP);
        }

        // Optional compression (off by default)
        // You can layer compression via \Redis::OPT_COMPRESSION in newer phpredis versions.
        // We'll keep it simple and off unless you ask.
    }

    protected function disconnect() {
        if ($this->redis instanceof \Redis) {
            try { $this->redis->close(); } catch (Throwable $e) {}
        }
    }

    protected function storage_set($id, $value, $ttl) {
        if ($ttl > 0) {
            return (bool) $this->redis->setEx($id, $ttl, $value);
        }
        return (bool) $this->redis->set($id, $value);
    }

    protected function storage_get($id, &$hit = null) {
        $res = $this->redis->get($id);
        if ($res === false && $this->redis->exists($id) === 0) {
            $hit = false;
            return false;
        }
        $hit = true;
        return $res;
    }

    protected function storage_get_multi(array $ids) {
        if (empty($ids)) return array();
        $vals = $this->redis->mGet($ids);
        $out  = array();
        foreach ($ids as $i => $id) {
            if ($vals[$i] !== false || $this->redis->exists($id)) {
                $out[$id] = $vals[$i];
            }
        }
        return $out;
    }

    protected function storage_delete($id) {
        return (bool) $this->redis->del($id);
    }

    protected function storage_incr($id, $offset) {
        if ($offset >= 0) {
            return $this->redis->incrBy($id, $offset);
        }
        // \Redis has no decrBy with negative; use decrBy(abs)
        return $this->redis->decrBy($id, abs($offset));
    }

    protected function storage_flush() {
        // Flush keys for our prefix only, not entire DB.
        // Use SCAN to avoid blocking \Redis; keep it simple for MVP.
        $cursor = null;
        $pattern = $this->prefix . '*';
        do {
            $keys = $this->redis->scan($cursor, $pattern, 1000);
            if ($keys !== false && !empty($keys)) {
                $this->redis->del($keys);
            }
        } while ($cursor !== 0 && $cursor !== null);
        return true;
    }
}
