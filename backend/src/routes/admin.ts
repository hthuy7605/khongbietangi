import { Router } from 'express';
import { z } from 'zod';
import { pool, tx } from '../db';
import { requireAdmin } from '../auth';
import { notFound } from '../errors';
import { dishInput, groupInput, placeInput } from '../schemas';
import { listDishes, listGroups, listPlaces, stats, upsertDish, upsertPlace } from '../services/catalog';
import { approveSuggestion, listSuggestions, rejectSuggestion } from '../services/suggestions';

export const adminRouter = Router();
adminRouter.use(requireAdmin);

const idOf = (v: unknown) => z.coerce.number().int().positive().parse(v);

async function remove(table: 'dishes' | 'places' | 'groups', id: number) {
  const r = await pool.query(`DELETE FROM ${table} WHERE id = $1`, [id]);
  if (!r.rowCount) throw notFound();
}

adminRouter.get('/stats', async (_req, res) => res.json(await stats()));

adminRouter.get('/groups', async (_req, res) => res.json(await listGroups()));
adminRouter.post('/groups', async (req, res) => {
  const g = groupInput.parse(req.body);
  const r = await pool.query(
    'INSERT INTO groups (name, emoji, sort_order) VALUES ($1,$2,$3) RETURNING id, name, emoji, sort_order AS "sortOrder"',
    [g.name, g.emoji, g.sortOrder],
  );
  res.status(201).json(r.rows[0]);
});
adminRouter.put('/groups/:id', async (req, res) => {
  const g = groupInput.parse(req.body);
  const r = await pool.query(
    'UPDATE groups SET name=$1, emoji=$2, sort_order=$3 WHERE id=$4 RETURNING id, name, emoji, sort_order AS "sortOrder"',
    [g.name, g.emoji, g.sortOrder, idOf(req.params.id)],
  );
  if (!r.rows[0]) throw notFound();
  res.json(r.rows[0]);
});
adminRouter.delete('/groups/:id', async (req, res) => {
  await remove('groups', idOf(req.params.id));
  res.json({ ok: true });
});

adminRouter.get('/dishes', async (_req, res) => res.json(await listDishes()));
adminRouter.post('/dishes', async (req, res) => {
  const id = await tx((c) => upsertDish(c, null, dishInput.parse(req.body)));
  res.status(201).json({ id });
});
adminRouter.put('/dishes/:id', async (req, res) => {
  const id = await tx((c) => upsertDish(c, idOf(req.params.id), dishInput.parse(req.body)));
  res.json({ id });
});
adminRouter.delete('/dishes/:id', async (req, res) => {
  await remove('dishes', idOf(req.params.id));
  res.json({ ok: true });
});

adminRouter.get('/places', async (_req, res) => res.json(await listPlaces()));
adminRouter.post('/places', async (req, res) => {
  const id = await tx((c) => upsertPlace(c, null, placeInput.parse(req.body)));
  res.status(201).json({ id });
});
adminRouter.put('/places/:id', async (req, res) => {
  const id = await tx((c) => upsertPlace(c, idOf(req.params.id), placeInput.parse(req.body)));
  res.json({ id });
});
adminRouter.delete('/places/:id', async (req, res) => {
  await remove('places', idOf(req.params.id));
  res.json({ ok: true });
});

adminRouter.get('/suggestions', async (req, res) => {
  const status = z.enum(['pending', 'approved', 'rejected']).catch('pending').parse(req.query.status);
  res.json(await listSuggestions(status));
});
adminRouter.post('/suggestions/:id/approve', async (req, res) => {
  await approveSuggestion(idOf(req.params.id), req.body?.payload);
  res.json({ ok: true });
});
adminRouter.post('/suggestions/:id/reject', async (req, res) => {
  const { reason } = z.object({ reason: z.string().trim().max(300).nullish() }).parse(req.body ?? {});
  await rejectSuggestion(idOf(req.params.id), reason || null);
  res.json({ ok: true });
});
