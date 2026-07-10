'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface LeaderboardItem {
  rank: number;
  id: number;
  user_id: number;
  username: string;
  final_score: number;
  result: string;
  scenario: string;
  played_at: string;
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ id: number; username: string } | null>(null);

  useEffect(() => {
    // 获取当前登录用户
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      try {
        setCurrentUser(JSON.parse(userStr));
      } catch (e) {
        console.error('Failed to parse user:', e);
      }
    }

    // 获取排行榜数据
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch('/api/leaderboard');
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data);
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRankStyle = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
    if (rank === 2) return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
    if (rank === 3) return 'bg-gradient-to-r from-orange-400 to-orange-600 text-white';
    return 'bg-gray-100 text-gray-700';
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* 标题 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
            🏆 排行榜
          </h1>
          <p className="text-gray-500 mt-2">前20名哄人高手</p>
        </div>

        {/* 返回按钮 */}
        <div className="mb-4">
          <Link
            href="/"
            className="inline-flex items-center text-pink-500 hover:text-pink-600"
          >
            <span className="mr-1">←</span> 返回首页
          </Link>
        </div>

        {/* 排行榜列表 */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
            <p className="text-gray-500 mt-4">加载中...</p>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <p className="text-6xl mb-4">📊</p>
            <p className="text-gray-500">暂无排行榜数据</p>
            <p className="text-gray-400 text-sm mt-2">快去玩游戏，成为第一名吧！</p>
          </div>
        ) : (
          <div className="space-y-3">
            {leaderboard.map((item) => {
              const isCurrentUser = currentUser && currentUser.id === item.user_id;
              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-xl shadow-md p-4 flex items-center transition-all ${
                    isCurrentUser ? 'ring-2 ring-pink-400 shadow-pink-200' : ''
                  }`}
                >
                  {/* 排名 */}
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${getRankStyle(item.rank)}`}>
                    {getRankIcon(item.rank)}
                  </div>

                  {/* 用户信息 */}
                  <div className="flex-1 ml-4">
                    <div className="flex items-center">
                      <span className="font-bold text-gray-800">{item.username}</span>
                      {isCurrentUser && (
                        <span className="ml-2 px-2 py-0.5 bg-pink-100 text-pink-600 text-xs rounded-full">
                          我
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {item.scenario} · {formatDate(item.played_at)}
                    </div>
                  </div>

                  {/* 分数 */}
                  <div className="text-right">
                    <div className="text-2xl font-bold text-pink-500">{item.final_score}</div>
                    <div className={`text-xs ${item.result === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                      {item.result === 'success' ? '✓ 通关' : '✗ 失败'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 提示信息 */}
        {!currentUser && (
          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
            <p className="text-yellow-700">
              💡 登录后参与游戏，你的成绩也会上榜哦！
            </p>
            <Link
              href="/login"
              className="inline-block mt-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
            >
              立即登录
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
