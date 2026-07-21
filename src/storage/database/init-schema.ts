import { getPool } from '@/storage/database/pg-client';

let schemaReady: Promise<void> | null = null;

async function runInitSchema(): Promise<void> {
  const pool = getPool();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS game_records (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      scenario VARCHAR(255) NOT NULL,
      final_score INTEGER NOT NULL,
      result VARCHAR(10) NOT NULL,
      played_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS blog_posts (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      summary TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS health_check (
      id SERIAL NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
}

export function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = runInitSchema();
  }
  return schemaReady;
}
