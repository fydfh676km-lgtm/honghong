import { NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { getDb } from '@/storage/database/pg-client';
import { gameRecords, users } from '@/storage/database/shared/schema';

export async function GET() {
  try {
    const db = getDb();
    const records = await db
      .select({
        id: gameRecords.id,
        user_id: gameRecords.user_id,
        username: users.username,
        final_score: gameRecords.final_score,
        result: gameRecords.result,
        scenario: gameRecords.scenario,
        played_at: gameRecords.played_at,
      })
      .from(gameRecords)
      .innerJoin(users, eq(gameRecords.user_id, users.id))
      .orderBy(desc(gameRecords.final_score))
      .limit(100);

    if (records.length === 0) {
      return NextResponse.json([]);
    }

    const userBestScores = new Map<number, {
      id: number;
      user_id: number;
      username: string;
      final_score: number;
      result: string;
      scenario: string;
      played_at: Date | null;
    }>();

    for (const record of records) {
      if (!userBestScores.has(record.user_id)) {
        userBestScores.set(record.user_id, record);
      }
    }

    const leaderboard = Array.from(userBestScores.values())
      .sort((a, b) => b.final_score - a.final_score)
      .slice(0, 20)
      .map((item, index) => ({
        rank: index + 1,
        ...item,
      }));

    return NextResponse.json(leaderboard);
  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
