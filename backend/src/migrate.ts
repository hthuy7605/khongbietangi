import { env } from './env';

async function main() {
  const { runner } = await import('node-pg-migrate');
  const direction = process.argv[2] === 'down' ? 'down' : 'up';
  const done = await runner({
    databaseUrl: { user: env.DB_USER, password: env.DB_PASSWORD, host: env.DB_HOST, port: env.DB_PORT, database: env.DB_NAME },
    dir: 'migrations',
    direction,
    count: direction === 'down' ? 1 : Infinity,
    migrationsTable: 'pgmigrations',
    log: console.log,
  });
  console.log(`${direction}: ${done.length} migration`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
