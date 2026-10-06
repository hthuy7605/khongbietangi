import { z } from 'zod';

export const env = z
  .object({
    NODE_ENV: z.string().default('development'),
    PORT: z.coerce.number().default(5000),
    DB_USER: z.string(),
    DB_PASSWORD: z.string(),
    DB_HOST: z.string(),
    DB_PORT: z.coerce.number().default(5432),
    DB_NAME: z.string(),
    JWT_SECRET: z.string().min(16),
    TURNSTILE_SECRET: z.string().optional(),
  })
  .parse(process.env);
