import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

let pool: Pool | null = null;
let db: ReturnType<typeof drizzle> | null = null;

const DB_ENV_KEYS = [
  'PGDATABASE_URL',
  'DATABASE_URL',
  'POSTGRES_URL',
  'POSTGRES_URL_NON_POOLING',
  'POSTGRES_PRISMA_URL',
] as const;

function normalizeConnectionString(connectionString: string): string {
  let normalized = connectionString;

  // channel_binding 在部分 Serverless 环境（如 Vercel）会导致连接失败
  if (process.env.VERCEL) {
    normalized = normalized.replace(/[&?]channel_binding=[^&]*/g, '');
  }

  return normalized;
}

function getConnectionString(): string {
  for (const key of DB_ENV_KEYS) {
    const value = process.env[key];
    if (value) {
      return normalizeConnectionString(value);
    }
  }

  throw new Error(
    `DB_ENV_MISSING: set one of ${DB_ENV_KEYS.join(', ')} in Vercel Environment Variables`,
  );
}

function getDatabaseEnvStatus(): Record<string, boolean> {
  return Object.fromEntries(
    DB_ENV_KEYS.map((key) => [key, Boolean(process.env[key])]),
  );
}

function shouldUseSsl(connectionString: string): boolean {
  return (
    process.env.NODE_ENV === 'production' ||
    connectionString.includes('sslmode=require') ||
    connectionString.includes('sslmode=verify-full')
  );
}

function getPool(): Pool {
  if (!pool) {
    const connectionString = getConnectionString();

    pool = new Pool({
      connectionString,
      ssl: shouldUseSsl(connectionString) ? { rejectUnauthorized: false } : undefined,
      max: process.env.VERCEL ? 1 : 10,
    });
  }
  return pool;
}

function getDb() {
  if (!db) {
    db = drizzle(getPool());
  }
  return db;
}

export { getDb, getPool, getDatabaseEnvStatus, DB_ENV_KEYS };
