'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { BlogPost } from '@/types';

export default function BlogPage() {
  const [posts, setPosts] = useState<Array<{ id: string; title: string; summary: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [topic, setTopic] = useState('');

  const fetchPosts = () => {
    fetch('/api/blog')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setPosts(data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleGenerateArticle = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic || undefined }),
      });
      if (res.ok) {
        fetchPosts(); // 刷新列表
        setTopic('');
      }
    } catch (err) {
      console.error('Generate failed:', err);
    }
    setGenerating(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-pink-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">💕</span>
            <span className="font-semibold text-gray-800">哄哄模拟器</span>
          </Link>
          <h1 className="text-xl font-bold text-pink-500">恋爱攻略</h1>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Generate Article Section */}
        <div className="bg-white rounded-xl shadow-sm border border-pink-100 p-4 mb-6">
          <div className="flex items-center gap-4">
            <input
              type="text"
              placeholder="输入文章主题（可选）"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="flex-1 px-4 py-2 border border-pink-200 rounded-lg focus:outline-none focus:border-pink-400 text-sm"
            />
            <button
              onClick={handleGenerateArticle}
              disabled={generating}
              className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-2"
            >
              {generating ? (
                <>
                  <span className="animate-spin">⏳</span>
                  生成中...
                </>
              ) : (
                <>
                  <span>✨</span>
                  AI生成新文章
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">💡 点击按钮，AI将自动生成一篇恋爱沟通技巧文章</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p>暂无文章</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {posts.map(post => (
              <Link
                key={post.id}
                href={`/blog/${post.id}`}
                className="bg-white rounded-xl shadow-sm border border-pink-100 p-6 hover:shadow-md hover:border-pink-200 transition-all"
              >
                <h2 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <span className="text-pink-500">📝</span>
                  {post.title}
                </h2>
                <p className="text-gray-600 text-sm leading-relaxed">{post.summary}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-gray-400">恋爱攻略</span>
                  <span className="text-pink-500 text-sm font-medium flex items-center gap-1">
                    阅读全文 <span>→</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white/80 border-t border-pink-100 py-6 text-center text-sm text-gray-500">
        <p>💕 哄哄模拟器 · 让恋爱更甜蜜</p>
      </footer>
    </div>
  );
}