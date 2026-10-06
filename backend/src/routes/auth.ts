import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { pool } from '../db';
import { checkPassword, clearSession, requireAdmin, setSession } from '../auth';
import { HttpError } from '../errors';
import { loginInput } from '../schemas';

export const authRouter = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (_req, res) =>
    res.status(429).json({ error: { code: 'rate_limited', message: 'Đăng nhập sai quá nhiều lần, thử lại sau 15 phút' } }),
});

authRouter.post('/login', loginLimiter, async (req, res) => {
  const { username, password } = loginInput.parse(req.body);
  const r = await pool.query('SELECT id, password_hash FROM admins WHERE username = $1', [username]);
  const admin = r.rows[0];
  const ok = await checkPassword(password, admin?.password_hash);
  if (!admin || !ok) throw new HttpError(401, 'bad_credentials', 'Sai tên đăng nhập hoặc mật khẩu');
  setSession(res, admin.id);
  res.json({ username });
});

authRouter.post('/logout', (_req, res) => {
  clearSession(res);
  res.json({ ok: true });
});

authRouter.get('/me', requireAdmin, (_req, res) => {
  res.json({ ok: true });
});
