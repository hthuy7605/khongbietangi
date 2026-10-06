import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { RequestHandler, Response } from 'express';
import { env } from './env';
import { HttpError } from './errors';

const COOKIE = 'kbag_admin';
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const DUMMY_HASH = bcrypt.hashSync('khong-ai-biet', 10);

export const checkPassword = (plain: string, hash: string | undefined) => bcrypt.compare(plain, hash ?? DUMMY_HASH);

export function setSession(res: Response, adminId: number) {
  const token = jwt.sign({ sub: String(adminId) }, env.JWT_SECRET, { expiresIn: '7d' });
  res.cookie(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
    maxAge: WEEK_MS,
    path: '/',
  });
}

export const clearSession = (res: Response) => res.clearCookie(COOKIE, { path: '/' });

export const requireAdmin: RequestHandler = (req, _res, next) => {
  try {
    jwt.verify(req.cookies?.[COOKIE] ?? '', env.JWT_SECRET);
    next();
  } catch {
    throw new HttpError(401, 'unauthorized', 'Bạn cần đăng nhập');
  }
};
