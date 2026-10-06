import { useCallback, useEffect, useState } from 'react';
import {
  addRejection,
  loadRejections,
  removeRejection,
  saveRejections,
  type Rejections,
} from '@/lib/rejections';

/** Danh sách "đã chê" lưu 1 giờ trong trình duyệt; `now` cập nhật mỗi 20 giây để đếm ngược. */
export function useRejected() {
  const [rejected, setRejected] = useState<Rejections>(() => loadRejections());
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = window.setInterval(() => {
      const n = Date.now();
      setNow(n);
      setRejected((r) => {
        const alive = loadRejections(n);
        return Object.keys(alive).length === Object.keys(r).length ? r : alive;
      });
    }, 20_000);
    return () => window.clearInterval(t);
  }, []);

  const update = useCallback((fn: (r: Rejections) => Rejections) => {
    setRejected((r) => {
      const next = fn(r);
      saveRejections(next);
      return next;
    });
  }, []);

  const reject = useCallback((key: string) => update((r) => addRejection(r, key, Date.now())), [update]);
  const unreject = useCallback((key: string) => update((r) => removeRejection(r, key)), [update]);
  const clear = useCallback(() => update(() => ({})), [update]);

  return { rejected, now, reject, unreject, clear };
}
