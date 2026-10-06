import { useCallback, useState } from 'react';
import type { Coords } from '@/lib/distance';

export type NearbyStatus = 'idle' | 'asking' | 'ready' | 'denied';

/** Vị trí chỉ nằm trong bộ nhớ trình duyệt, không gửi lên máy chủ. */
export function useNearby() {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [status, setStatus] = useState<NearbyStatus>('idle');

  const request = useCallback((): Promise<Coords | null> => {
    if (coords) return Promise.resolve(coords);
    if (!('geolocation' in navigator)) {
      setStatus('denied');
      return Promise.resolve(null);
    }
    setStatus('asking');
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setCoords(c);
          setStatus('ready');
          resolve(c);
        },
        () => {
          setStatus('denied');
          resolve(null);
        },
        { enableHighAccuracy: false, timeout: 10_000, maximumAge: 5 * 60_000 },
      );
    });
  }, [coords]);

  return { coords, status, request };
}
