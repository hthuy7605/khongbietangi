import { useCallback, useEffect, useRef, useState } from 'react';

const STEPS = 14;
const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Chạy hiệu ứng slot: nhảy qua các phần tử ngẫu nhiên, chậm dần rồi dừng ở `target`. */
export function useSlot<T>() {
  const [shown, setShown] = useState<T | null>(null);
  const [spinning, setSpinning] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const run = useCallback((pool: T[], target: T) => {
    window.clearTimeout(timer.current);
    if (prefersReducedMotion() || pool.length < 2) {
      setShown(target);
      setSpinning(false);
      return Promise.resolve();
    }
    setSpinning(true);
    return new Promise<void>((resolve) => {
      let i = 0;
      let last: T | null = null;
      const tick = () => {
        if (i >= STEPS) {
          setShown(target);
          setSpinning(false);
          resolve();
          return;
        }
        let next = pool[Math.floor(Math.random() * pool.length)] as T;
        if (next === last) next = pool[(pool.indexOf(next) + 1) % pool.length] as T;
        last = next;
        setShown(next);
        i++;
        timer.current = window.setTimeout(tick, 55 + i * i * 1.2);
      };
      tick();
    });
  }, []);

  const reset = useCallback(() => {
    window.clearTimeout(timer.current);
    setShown(null);
    setSpinning(false);
  }, []);

  return { shown, spinning, run, reset };
}
