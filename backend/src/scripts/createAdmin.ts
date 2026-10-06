import bcrypt from 'bcryptjs';
import { pool } from '../db';

// Dùng: pnpm admin:create <username> <password>. Không truyền gì: chuyển tài khoản cũ từ users_legacy (mật khẩu được hash).
async function main() {
  let [username, password] = process.argv.slice(2);
  if (!username || !password) {
    const r = await pool.query('SELECT username, password FROM users_legacy ORDER BY id LIMIT 1');
    if (!r.rows[0]) throw new Error('Không có tài khoản cũ, hãy truyền: <username> <password>');
    ({ username, password } = r.rows[0]);
    console.log(`Chuyển tài khoản cũ "${username}". Nên đổi mật khẩu mạnh hơn bằng lệnh có đủ tham số.`);
  }
  const hash = await bcrypt.hash(password!, 12);
  await pool.query(
    'INSERT INTO admins (username, password_hash) VALUES ($1, $2) ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash',
    [username, hash],
  );
  console.log(`Đã lưu admin "${username}"`);
}

main()
  .catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
