<?php

/**
 * Lempify Memcached Object Cache (php-memcached)
 */

defined('ABSPATH') || exit;

class Lempify_Object_Cache_Memcached extends WP_Object_Cache
{

    /** @var Memcached */
    protected $mc;

    protected function connect()
    {
        if (!class_exists('Memcached')) {
            throw new RuntimeException('php-memcached extension not installed.');
        }

        $this->mc = new \Memcached();

        // Options
        $this->mc->setOption(
            \Memcached::OPT_BINARY_PROTOCOL,
            defined('LEMPIFY_MEMCACHED_BINARY') ? (bool) LEMPIFY_MEMCACHED_BINARY : true
        );
        $this->mc->setOption(
            \Memcached::OPT_LIBKETAMA_COMPATIBLE,
            defined('LEMPIFY_MEMCACHED_CONSISTENT') ? (bool) LEMPIFY_MEMCACHED_CONSISTENT : true
        );

        $serializer = \Memcached::HAVE_IGBINARY && extension_loaded('igbinary') ? \Memcached::SERIALIZER_IGBINARY : \Memcached::SERIALIZER_PHP;

        $this->mc->setOption(\Memcached::OPT_SERIALIZER, $serializer);

        // Servers
        $servers = array('127.0.0.1:11211');
        if (defined('LEMPIFY_MEMCACHED_SERVERS')) {
            $cfg = @unserialize(LEMPIFY_MEMCACHED_SERVERS);
            if (is_array($cfg) && !empty($cfg)) {
                $servers = $cfg;
            }
        }

        $svr_list = $this->mc->getServerList();
        if (empty($svr_list)) {
            $add = array();
            foreach ($servers as $server) {
                list($host, $port) = array_pad(explode(':', $server, 2), 2, 11211);
                $add[] = array($host, (int)$port);
            }
            $this->mc->addServers($add);
        }

        // SASL (if provided)
        if (defined('LEMPIFY_MEMCACHED_SASL_USER') && LEMPIFY_MEMCACHED_SASL_USER !== '') {
            if (method_exists($this->mc, 'setSaslAuthData')) {
                $this->mc->setSaslAuthData(
                    LEMPIFY_MEMCACHED_SASL_USER,
                    defined('LEMPIFY_MEMCACHED_SASL_PASS') ? LEMPIFY_MEMCACHED_SASL_PASS : ''
                );
            }
        }

        // Basic connectivity test
        $this->mc->set($this->prefix . '__lempify_ping', 1, 5);
        $ok = (1 === $this->mc->get($this->prefix . '__lempify_ping'));
        if (!$ok) {
            throw new RuntimeException('Memcached connectivity check failed.');
        }
    }

    protected function disconnect()
    {
        if ($this->mc instanceof \Memcached) {
            try {
                $this->mc->quit();
            } catch (Throwable $e) {
            }
        }
    }

    protected function storage_set($id, $value, $ttl)
    {
        return (bool) $this->mc->set($id, $value, $ttl);
    }

    protected function storage_get($id, &$hit = null)
    {
        $res = $this->mc->get($id);
        $rc  = $this->mc->getResultCode();
        $hit = ($rc === Memcached::RES_SUCCESS);
        return $hit ? $res : false;
    }

    protected function storage_get_multi(array $ids)
    {
        if (empty($ids)) return array();
        $res = $this->mc->getMulti($ids);
        if (!is_array($res)) return array();
        return $res;
    }

    protected function storage_delete($id)
    {
        $this->mc->delete($id);
        $rc = $this->mc->getResultCode();
        return in_array($rc, array(\Memcached::RES_SUCCESS, \Memcached::RES_NOTFOUND), true);
    }

    protected function storage_incr($id, $offset)
    {
        if ($offset >= 0) {
            $res = $this->mc->increment($id, $offset);
        } else {
            $res = $this->mc->decrement($id, abs($offset));
        }
        if ($res === false && $this->mc->getResultCode() === \Memcached::RES_NOTFOUND) {
            // Initialize counter if absent
            $this->mc->add($id, 0);
            if ($offset >= 0) {
                $res = $this->mc->increment($id, $offset);
            } else {
                $cur = 0 - abs($offset);
                $this->mc->set($id, $cur);
                $res = $cur;
            }
        }
        return $res;
    }

    protected function storage_flush()
    {
        // Namespace token trick — safer than global flush
        $token_key = $this->prefix . '__lempify_namespace_token';
        $token     = (int) $this->mc->get($token_key);
        $this->mc->set($token_key, $token + 1, 0);
        return true;
    }
}
