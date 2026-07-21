import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

let pool: Pool | null = null;
let db: ReturnType<typeof drizzle> | null = null;

function getConnectionString(): string {
  const connectionString = process.env.PGDATABASE_URL ?? process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('PGDATABASE_URL or DATABASE_URL is not set');
  }
  return connectionString;
}

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({ connectionString: getConnectionString() });
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
