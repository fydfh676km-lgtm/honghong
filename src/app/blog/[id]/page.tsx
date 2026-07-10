'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { BlogPost } from '@/types';

export default function BlogDetailPage() {
  const params = useParams();
  const postId = params.id as string;
  
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/blog?id=${postId}`)
      .then(res => res.json())
      .then(data => {
        setPost(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [postId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-blue-50">
        <header className="bg-white/80 backdrop-blur-sm border-b border-pink-100 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/blog" className="text-pink-500 flex items-center gap-1">
              <span>←</span> 返回列表
            </Link>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-20 text-center text-gray-500">
          <p>文章不存在</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-pink-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/blog" className="text-pink-500 flex items-center gap-1 hover:underline">
            <span>←</span> 返回列表
          </Link>
          <Link href="/" className="text-gray-500 flex items-center gap-2 hover:text-pink-500">
            <span>💕</span> 首页
          </Link>
        </div>
      </header>

      {/* Article Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <article className="bg-white rounded-xl shadow-sm border border-pink-100 p-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <span className="text-3xl">📝</span>
            {post.title}
          </h1>
          
          <div className="prose prose-pink max-w-none">
            <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {post.content}
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-pink-100 flex items-center justify-between">
            <span className="text-sm text-gray-400">恋爱攻略 · 哄哄模拟器</span>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-pink-50 text-pink-500 rounded-lg text-sm hover:bg-pink-100 transition-colors">
                💖 有帮助
              </button>
              <button className="px-4 py-2 bg-gray-50 text-gray-500 rounded-lg text-sm hover:bg-gray-100 transition-colors">
                分享
              </button>
            </div>
          </div>
        </article>

        {/* Related Links */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <Link
            href="/blog"
            className="flex-1 bg-white rounded-xl border border-pink-100 p-6 hover:border-pink-200 transition-colors flex items-center justify-between"
          >
            <span className="text-gray-800 font-medium">查看更多攻略</span>
            <span className="text-pink-500">→</span>
          </Link>
          <Link
            href="/"
            className="flex-1 bg-gradient-to-r from-pink-500 to-blue-500 rounded-xl p-6 hover:opacity-90 transition-opacity flex items-center justify-between text-white"
          >
            <span className="font-medium">开始哄哄模拟</span>
            <span>💕</span>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/80 border-t border-pink-100 py-6 text-center text-sm text-gray-500 mt-8">
        <p>💕 哄哄模拟器 · 让恋爱更甜蜜</p>
      </footer>
    </div>
  );
}