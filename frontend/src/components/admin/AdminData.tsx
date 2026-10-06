import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, toApiError } from '@/lib/api';
import type { Dish, Group, Place, Stats } from '@/lib/types';

interface AdminDataValue {
  dishes: Dish[];
  places: Place[];
  groups: Group[];
  stats: Stats | null;
  loading: boolean;
  error: string;
  reload: () => Promise<void>;
  dishName: (id: number) => string;
  placeName: (id: number) => string;
}

const Ctx = createContext<AdminDataValue | null>(null);

export function AdminDataProvider({ children, onUnauthorized }: { children: ReactNode; onUnauthorized: () => void }) {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    try {
      const [d, p, g, s] = await Promise.all([api.admin.dishes(), api.admin.places(), api.admin.groups(), api.admin.stats()]);
      setDishes(d);
      setPlaces(p);
      setGroups(g);
      setStats(s);
      setError('');
    } catch (e) {
      const err = toApiError(e);
      if (err.status === 401) onUnauthorized();
      else setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [onUnauthorized]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const value = useMemo<AdminDataValue>(() => {
    const dMap = new Map(dishes.map((d) => [d.id, d.name]));
    const pMap = new Map(places.map((p) => [p.id, p.name]));
    return {
      dishes,
      places,
      groups,
      stats,
      loading,
      error,
      reload,
      dishName: (id) => dMap.get(id) ?? `Món #${id}`,
      placeName: (id) => pMap.get(id) ?? `Quán #${id}`,
    };
  }, [dishes, places, groups, stats, loading, error, reload]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAdminData() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAdminData ngoài AdminDataProvider');
  return v;
}
