export const REJECT_TTL_MS = 60 * 60 * 1000;
const KEY = 'khongbietangi_rejections_v2';

/** Khóa dạng "dish:12" hoặc "place:3"; giá trị là thời điểm hết hạn (ms). */
export type Rejections = Record<string, number>;

export const dishKey = (id: number) => `dish:${id}`;
export const placeKey = (id: number) => `place:${id}`;

export function prune(r: Rejections, now: number): Rejections {
  return Object.fromEntries(Object.entries(r).filter(([, exp]) => exp > now));
}

export const addRejection = (r: Rejections, key: string, now: number): Rejections => ({
  ...prune(r, now),
  [key]: now + REJECT_TTL_MS,
});

export function removeRejection(r: Rejections, key: string): Rejections {
  const { [key]: _removed, ...rest } = r;
  return rest;
}

export function loadRejections(now = Date.now()): Rejections {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Rejections;
    return prune(typeof parsed === 'object' && parsed ? parsed : {}, now);
  } catch {
    return {};
  }
}

export function saveRejections(r: Rejections) {
  try {
    localStorage.setItem(KEY, JSON.stringify(r));
  } catch {
    // trình duyệt chặn lưu: vẫn dùng được trong phiên hiện tại
  }
}
