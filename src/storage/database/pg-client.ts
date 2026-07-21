import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

let pool: Pool | null = null;
let db: ReturnType<typeof drizzle> | null = null;

function normalizeConnectionString(connectionString: string): string {
  let normalized = connectionString;

  // channel_binding 在部分 Serverless 环境（如 Vercel）会导致连接失败
  if (process.env.VERCEL) {
    normalized = normalized.replace(/[&?]channel_binding=[^&]*/g, '');
  }

  return normalized;
}

function getConnectionString(): string {
  const connectionString = process.env.PGDATABASE_URL ?? process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('PGDATABASE_URL or DATABASE_URL is not set');
  }
  return normalizeConnectionString(connectionString);
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

export { getDb, getPool };
