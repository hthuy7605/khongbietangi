import { HttpError } from '../errors';

const HOSTS = new Set(['maps.app.goo.gl', 'goo.gl', 'google.com', 'www.google.com', 'maps.google.com']);
const NUM = '(-?\\d{1,3}\\.\\d+)';
const PATTERNS = [
  new RegExp(`!3d${NUM}!4d${NUM}`),
  new RegExp(`@${NUM},${NUM}`),
  new RegExp(`[?&](?:q|ll|query|destination)=${NUM},${NUM}`),
];

export function parseCoords(url: string): { lat: number; lng: number } | null {
  let s = url;
  try {
    s = decodeURIComponent(url);
  } catch {
    // giữ nguyên chuỗi gốc
  }
  for (const re of PATTERNS) {
    const m = re.exec(s);
    if (m) {
      const lat = Number(m[1]);
      const lng = Number(m[2]);
      if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) return { lat, lng };
    }
  }
  return null;
}

const bad = (msg: string) => new HttpError(422, 'bad_maps_url', msg);

export async function resolveMapsUrl(raw: string): Promise<{ url: string; lat: number; lng: number }> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw bad('Link không hợp lệ');
  }
  for (let hop = 0; hop < 6; hop++) {
    if (url.protocol !== 'https:' || !HOSTS.has(url.hostname)) throw bad('Chỉ nhận link Google Maps (https)');
    const coords = parseCoords(url.href);
    if (coords) return { url: url.href, ...coords };
    const res = await fetch(url, {
      redirect: 'manual',
      signal: AbortSignal.timeout(5000),
      headers: { 'user-agent': 'Mozilla/5.0' },
    }).catch(() => {
      throw bad('Không mở được link, thử dán link đầy đủ từ thanh địa chỉ');
    });
    await res.body?.cancel();
    const next = res.headers.get('location');
    if (!next) break;
    url = new URL(next, url);
  }
  throw bad('Không đọc được tọa độ từ link này, thử dán link đầy đủ có dạng .../@10.77,106.69,...');
}
