import { createHash } from 'node:crypto';
import { pool, tx } from '../db';
import { env } from '../env';
import { HttpError, notFound } from '../errors';
import { payloadSchemas, type SuggestionKind } from '../schemas';
import { upsertDish, upsertPlace } from './catalog';
import { similar } from './text';

const MAX_PENDING = 300;

export const hashIp = (ip: string) => createHash('sha256').update(ip + env.JWT_SECRET).digest('hex').slice(0, 32);

export async function verifyTurnstile(token: string | undefined, ip: string) {
  if (!env.TURNSTILE_SECRET) return;
  if (!token) throw new HttpError(400, 'captcha', 'Cần xác minh bạn không phải robot');
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: new URLSearchParams({ secret: env.TURNSTILE_SECRET, response: token, remoteip: ip }),
    signal: AbortSignal.timeout(5000),
  }).catch(() => null);
  const body = (await res?.json().catch(() => null)) as { success?: boolean } | null;
  if (!body?.success) throw new HttpError(400, 'captcha', 'Xác minh không thành công, thử lại nhé');
}

export async function createSuggestion(kind: SuggestionKind, payload: unknown, ip: string) {
  const data = payloadSchemas[kind].parse(payload);
  const pending = await pool.query("SELECT count(*)::int AS n FROM suggestions WHERE status = 'pending'");
  if (pending.rows[0].n >= MAX_PENDING) {
    throw new HttpError(503, 'queue_full', 'Hàng chờ đang đầy, quay lại sau nhé');
  }
  await pool.query('INSERT INTO suggestions (kind, payload, ip_hash) VALUES ($1, $2, $3)', [kind, data, hashIp(ip)]);
}

type Dup = { type: 'dish' | 'place' | 'link'; id: number; name: string };

export async function listSuggestions(status: string) {
  const [rows, dishes, places, links] = await Promise.all([
    pool.query(
      `SELECT id, kind, payload, status, reject_reason AS "rejectReason", created_at AS "createdAt", reviewed_at AS "reviewedAt"
       FROM suggestions WHERE status = $1 ORDER BY created_at DESC LIMIT 200`,
      [status],
    ),
    pool.query('SELECT id, name FROM dishes'),
    pool.query('SELECT id, name, maps_url FROM places'),
    pool.query('SELECT dish_id, place_id FROM dish_places'),
  ]);
  return rows.rows.map((s) => {
    const duplicates: Dup[] = [];
    if (s.kind === 'dish') {
      for (const d of dishes.rows) if (similar(d.name, s.payload.name)) duplicates.push({ type: 'dish', id: d.id, name: d.name });
    } else if (s.kind === 'place') {
      for (const p of places.rows) {
        if (similar(p.name, s.payload.name) || (s.payload.mapsUrl && p.maps_url === s.payload.mapsUrl)) {
          duplicates.push({ type: 'place', id: p.id, name: p.name });
        }
      }
      for (const n of s.payload.newDishNames ?? []) {
        for (const d of dishes.rows) if (similar(d.name, n)) duplicates.push({ type: 'dish', id: d.id, name: d.name });
      }
    } else if (links.rows.some((l) => l.dish_id === s.payload.dishId && l.place_id === s.payload.placeId)) {
      duplicates.push({ type: 'link', id: s.id, name: 'Liên kết món–quán đã tồn tại' });
    }
    return { ...s, duplicates };
  });
}

export async function approveSuggestion(id: number, edited?: unknown) {
  return tx(async (c) => {
    const found = await c.query('SELECT kind, payload, status FROM suggestions WHERE id = $1 FOR UPDATE', [id]);
    const row = found.rows[0];
    if (!row) throw notFound('Đề xuất không tồn tại');
    if (row.status !== 'pending') throw new HttpError(409, 'already_reviewed', 'Đề xuất này đã được xử lý');
    const kind = row.kind as SuggestionKind;
    const input = edited ?? row.payload;

    if (kind === 'dish') {
      await upsertDish(c, null, { ...payloadSchemas.dish.parse(input), weight: 3, isActive: true });
    } else if (kind === 'place') {
      const p = payloadSchemas.place.parse(input);
      const dishIds = new Set(p.dishIds);
      for (const name of p.newDishNames) {
        const existing = await c.query('SELECT id FROM dishes WHERE lower(name) = lower($1)', [name]);
        dishIds.add(
          existing.rows[0]?.id ??
            (await upsertDish(c, null, { name, emoji: '🍽️', description: null, meals: [], groupIds: [], placeIds: [], weight: 3, isActive: true })),
        );
      }
      const { newDishNames: _n, ...fields } = p;
      await upsertPlace(c, null, { ...fields, dishIds: [...dishIds], weight: 3, isActive: true });
    } else {
      const l = payloadSchemas.link.parse(input);
      await c.query('INSERT INTO dish_places (dish_id, place_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [l.dishId, l.placeId]);
    }
    await c.query("UPDATE suggestions SET status = 'approved', reviewed_at = now() WHERE id = $1", [id]);
  });
}

export async function rejectSuggestion(id: number, reason: string | null) {
  const r = await pool.query(
    "UPDATE suggestions SET status = 'rejected', reject_reason = $2, reviewed_at = now() WHERE id = $1 AND status = 'pending'",
    [id, reason],
  );
  if (!r.rowCount) throw new HttpError(409, 'already_reviewed', 'Đề xuất không còn ở trạng thái chờ');
}
