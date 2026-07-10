import { NextRequest, NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { getDb } from '@/storage/database/pg-client';
import { gameRecords } from '@/storage/database/shared/schema';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, scenario, finalScore, result } = body;

    if (!userId || !scenario || finalScore === undefined || !result) {
      return NextResponse.json(
        { error: '缺少必填字段' },
        { status: 400 }
      );
    }

    if (!['win', 'lose'].includes(result)) {
      return NextResponse.json(
        { error: 'result必须是win或lose' },
        { status: 400 }
      );
    }

    const db = getDb();
    const [data] = await db
      .insert(gameRecords)
      .values({
        user_id: userId,
        scenario,
        final_score: finalScore,
        result,
      })
      .returning();

    if (!data) {
      return NextResponse.json(
        { error: '保存游戏记录失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      record: {
        id: data.id,
        userId: data.user_id,
        scenario: data.scenario,
        finalScore: data.final_score,
        result: data.result,
        playedAt: data.played_at,
      },
    });
  } catch (error) {
    console.error('保存游戏记录异常:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: '缺少userId参数' },
        { status: 400 }
      );
    }

    const db = getDb();
    const data = await db
      .select()
      .from(gameRecords)
      .where(eq(gameRecords.user_id, parseInt(userId)))
      .orderBy(desc(gameRecords.played_at))
      .limit(50);

    const records = data.map((item) => ({
      id: item.id,
      userId: item.user_id,
      scenario: item.scenario,
      finalScore: item.final_score,
      result: item.result,
      playedAt: item.played_at,
    }));

    return NextResponse.json({
      success: true,
      records,
    });
  } catch (error) {
    console.error('查询游戏记录异常:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
