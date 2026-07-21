import { NextResponse } from 'next/server';
import { DB_ENV_KEYS, getDatabaseEnvStatus } from '@/storage/database/pg-client';

export async function GET() {
  const databaseEnv = getDatabaseEnvStatus();
  const configured = DB_ENV_KEYS.some((key) => databaseEnv[key]);

  return NextResponse.json({
    ok: configured,
    databaseEnv,
    requiredAnyOf: DB_ENV_KEYS,
    isVercel: Boolean(process.env.VERCEL),
    hint: configured
      ? 'Database env is configured'
      : 'Add DATABASE_URL in Vercel → Settings → Environment Variables, then Redeploy',
  });
}
