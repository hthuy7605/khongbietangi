import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      reset: (id?: string) => void;
      remove: (id?: string) => void;
    };
  }
}

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;
const SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

export const turnstileEnabled = Boolean(SITE_KEY);

function loadScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SRC}"]`);
    const s = existing ?? Object.assign(document.createElement('script'), { src: SRC, async: true });
    s.addEventListener('load', () => resolve(), { once: true });
    s.addEventListener('error', () => reject(new Error('turnstile')), { once: true });
    if (!existing) document.head.appendChild(s);
  });
}

interface Props {
  onToken: (token: string | null) => void;
  resetKey: number;
}

/** Chỉ hiện khi đặt VITE_TURNSTILE_SITE_KEY; đổi `resetKey` để yêu cầu xác minh lại sau mỗi lần gửi. */
export function Turnstile({ onToken, resetKey }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const widget = useRef<string | undefined>(undefined);
  const cb = useRef(onToken);
  cb.current = onToken;

  useEffect(() => {
    if (!SITE_KEY) return;
    let cancelled = false;
    void loadScript().then(() => {
      if (cancelled || !box.current || !window.turnstile) return;
      widget.current = window.turnstile.render(box.current, {
        sitekey: SITE_KEY,
        callback: (t: string) => cb.current(t),
        'expired-callback': () => cb.current(null),
        'error-callback': () => cb.current(null),
        language: 'vi',
      });
    });
    return () => {
      cancelled = true;
      if (widget.current) window.turnstile?.remove(widget.current);
    };
  }, []);

  useEffect(() => {
    if (resetKey > 0 && widget.current) {
      cb.current(null);
      window.turnstile?.reset(widget.current);
    }
  }, [resetKey]);

  return SITE_KEY ? <div ref={box} className="min-h-[65px]" /> : null;
}
