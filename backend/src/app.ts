import cookieParser from 'cookie-parser';
import express, { type ErrorRequestHandler } from 'express';
import helmet from 'helmet';
import { ZodError } from 'zod';
import { HttpError } from './errors';
import { adminRouter } from './routes/admin';
import { authRouter } from './routes/auth';
import { publicRouter } from './routes/public';

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const send = (status: number, code: string, message: string, fields?: Record<string, string>) =>
    res.status(status).json({ error: { code, message, fields } });

  if (err instanceof ZodError) {
    const fields: Record<string, string> = {};
    for (const i of err.issues) fields[i.path.join('.')] ??= i.message;
    return send(400, 'validation', 'Dữ liệu chưa hợp lệ', fields);
  }
  if (err instanceof HttpError) return send(err.status, err.code, err.message);
  if (err?.type === 'entity.parse.failed') return send(400, 'bad_json', 'Dữ liệu gửi lên không đúng định dạng');
  if (err?.code === '23505') return send(409, 'duplicate', 'Dữ liệu này đã tồn tại');
  if (err?.code === '23503') return send(400, 'bad_reference', 'Có mục liên kết không tồn tại');
  console.error(err);
  return send(500, 'server_error', 'Máy chủ gặp lỗi, thử lại sau nhé');
};

export function createApp() {
  const app = express();
  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(express.json({ limit: '50kb' }));
  app.use(cookieParser());
  app.use('/api', publicRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: { code: 'not_found', message: 'Không tìm thấy' } });
  });
  app.use(errorHandler);
  return app;
}
