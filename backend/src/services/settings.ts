import { pool } from '../db';

export async function getSetting(key: string): Promise<boolean> {
  const result = await pool.query('SELECT value FROM settings WHERE key = $1', [key]);
  if (result.rows.length === 0) return true;
  return result.rows[0].value === true;
}

export async function setSetting(key: string, value: boolean): Promise<void> {
  await pool.query(
    'INSERT INTO settings (key, value, updated_at) VALUES ($1, $2, now()) ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = now()',
    [key, value]
  );
}
