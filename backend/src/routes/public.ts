import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import { pool } from '../db';
import { publicCatalog } from '../services/catalog';
import { resolveMapsUrl } from '../services/maps';
import { createSuggestion, verifyTurnstile } from '../services/suggestions';
import { suggestionEnvelope } from '../schemas';

const limiter = (limit: number, windowMs: number) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, res) =>
      res.status(429).json({ error: { code: 'rate_limited', message: 'Bạn thao tác hơi nhanh, đợi một lát nhé' } }),
  });

export const publicRouter = Router();

publicRouter.get('/health', async (_req, res) => {
  await pool.query('SELECT 1');
  res.json({ ok: true });
});

publicRouter.get('/catalog', async (_req, res) => {
  res.json(await publicCatalog());
});

publicRouter.post('/maps/resolve', limiter(30, 60 * 60 * 1000), async (req, res) => {
  const { url } = z.object({ url: z.string().trim().max(500) }).parse(req.body);
  res.json(await resolveMapsUrl(url));
});

publicRouter.post('/suggestions', limiter(5, 60 * 60 * 1000), async (req, res) => {
  const body = suggestionEnvelope.parse(req.body);
  if (body.website) {
    res.status(201).json({ ok: true });
    return;
  }
  await verifyTurnstile(body.turnstileToken, req.ip ?? '');
  await createSuggestion(body.kind, body.payload, req.ip ?? '');
  res.status(201).json({ ok: true });
});
