'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface GameRecord {
  id: string;
  scenario: string;
  final_score: number;
  result: string;
  played_at: string;
}

export default function ProfilePage() {
  const [records, setRecords] = useState<GameRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');

  useEffect(() => {
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) {
      window.location.href = '/login';
      return;
    }
    const user = JSON.parse(userStr);
    setUsername(user.username);
    fetchRecords(user.id);
  }, []);

  const fetchRecords = async (userId: number) => {
    try {
      const response = await fetch(`/api/game-records?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setRecords(data.records || []);
      }
    } catch (error) {
      console.error('Failed to fetch records:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    window.location.href = '/';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-100 via-pink-50 to-blue-100">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">💕</div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-100 via-pink-50 to-blue-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-rose-400 to-pink-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {username.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{username}</h1>
                <p className="text-gray-500 text-sm">共 {records.length} 局游戏记录</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link
                href="/"
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
              >
                返回首页
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-colors"
              >
                退出登录
              </button>
            </div>
          </div>
        </div>

        {/* Game Records */}
        <div className="bg-white rounded-3xl shadow-xl p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">🎮 游戏记录</h2>
          
          {records.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <p className="text-gray-500">还没有游戏记录</p>
              <Link
                href="/"
                className="mt-4 inline-block px-6 py-3 bg-gradient-to-r from-rose-400 to-pink-500 text-white rounded-full hover:shadow-lg transition-shadow"
              >
                开始游戏
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {records.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                        record.result === '通关'
                          ? 'bg-green-100'
                          : 'bg-red-100'
                      }`}
                    >
                      {record.result === '通关' ? '✅' : '❌'}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{record.scenario}</h3>
                      <p className="text-sm text-gray-500">{formatDate(record.played_at)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-lg font-bold ${
                        record.result === '通关'
                          ? 'text-green-500'
                          : 'text-red-500'
                      }`}
                    >
                      {record.result}
                    </div>
                    <div className="text-sm text-gray-500">
                      好感度: {record.final_score}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
