import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { getDb } from '@/storage/database/pg-client';
import { ensureSchema } from '@/storage/database/init-schema';
import { users } from '@/storage/database/shared/schema';

const DEBUG_ENDPOINT = 'http://127.0.0.1:7688/ingest/64ddcd07-a1be-41a7-b8c2-7f8fd42ad0a8';
const DEBUG_SESSION = '5dd60b';

function debugLog(
  hypothesisId: string,
  location: string,
  message: string,
  data: Record<string, unknown>,
): void {
  // #region agent log
  fetch(DEBUG_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Debug-Session-Id': DEBUG_SESSION,
    },
    body: JSON.stringify({
      sessionId: DEBUG_SESSION,
      runId: 'register-debug',
      hypothesisId,
      location,
      message,
      data,
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
}

function isPostgresError(error: unknown): error is { code?: string; message?: string } {
  return typeof error === 'object' && error !== null && 'code' in error;
}

function getSafeErrorInfo(error: unknown): { code: string; message: string } {
  if (error instanceof Error) {
    return { code: 'ERROR', message: error.message };
  }
  if (isPostgresError(error)) {
    return {
      code: error.code ?? 'PG_ERROR',
      message: error.message ?? 'postgres error',
    };
  }
  return { code: 'UNKNOWN', message: 'unknown error' };
}

export async function POST(request: NextRequest) {
  try {
    // #region agent log
    debugLog('A', 'register/route.ts:POST:entry', 'register request started', {
      hasPgDatabaseUrl: Boolean(process.env.PGDATABASE_URL),
      hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
      isVercel: Boolean(process.env.VERCEL),
    });
    // #endregion

    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: '用户名和密码不能为空' },
        { status: 400 }
      );
    }

    if (username.length < 3 || username.length > 50) {
      return NextResponse.json(
        { error: '用户名长度需要在3-50个字符之间' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: '密码长度至少6个字符' },
        { status: 400 }
      );
    }

    await ensureSchema();
    // #region agent log
    debugLog('C', 'register/route.ts:POST:after-schema', 'ensureSchema succeeded', {});
    // #endregion

    const db = getDb();
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: '用户名已存在' },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [newUser] = await db
      .insert(users)
      .values({
        username,
        password_hash: passwordHash,
      })
      .returning({
        id: users.id,
        username: users.username,
        created_at: users.created_at,
      });

    if (!newUser) {
      return NextResponse.json(
        { error: '注册失败，请稍后重试' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        username: newUser.username,
        createdAt: newUser.created_at,
      },
    });
  } catch (error) {
    const safeError = getSafeErrorInfo(error);
    console.error('注册错误:', safeError, error);
    // #region agent log
    debugLog('B', 'register/route.ts:POST:catch', 'register failed', safeError);
    // #endregion

    if (isPostgresError(error) && error.code === '23505') {
      return NextResponse.json(
        { error: '用户名已存在' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: '服务器错误',
        debugStage: safeError.code,
        debugMessage: safeError.message,
      },
      { status: 500 }
    );
  }
}
