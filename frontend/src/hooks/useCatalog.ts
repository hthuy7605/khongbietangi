import { useCallback, useEffect, useState } from 'react';
import { api, toApiError } from '@/lib/api';
import type { Catalog } from '@/lib/types';

export function useCatalog() {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setCatalog(await api.catalog());
    } catch (e) {
      setError(toApiError(e).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { catalog, error, loading, reload: load };
}
