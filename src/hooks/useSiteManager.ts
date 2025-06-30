import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { SiteInfo } from '../types';

export default function useSiteManager() {
  const [sites, setSites] = useState<SiteInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSites = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await invoke<SiteInfo[]>('list_sites');
      setSites(result);
    } catch (err: any) {
      console.error('❌ Failed to load sites:', err);
      setError(err?.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSites();
  }, []);

  return { sites, loading, error, refresh: loadSites };
}
