import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import { desc, eq } from 'drizzle-orm';
import { getDb } from '@/storage/database/pg-client';
import { blogPosts } from '@/storage/database/shared/schema';
import type { BlogPost } from '@/types';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  try {
    const db = getDb();

    if (id) {
      const [data] = await db
        .select()
        .from(blogPosts)
        .where(eq(blogPosts.id, parseInt(id)))
        .limit(1);

      if (!data) {
        return NextResponse.json({ error: '文章不存在' }, { status: 404 });
      }

      const post: BlogPost = {
        id: data.id.toString(),
        title: data.title,
        summary: data.summary,
        content: data.content,
        createdAt: new Date(data.created_at ?? Date.now()).getTime(),
      };

      return NextResponse.json(post);
    }

    const data = await db
      .select()
      .from(blogPosts)
      .orderBy(desc(blogPosts.created_at));

    const posts: BlogPost[] = data.map((item) => ({
      id: item.id.toString(),
      title: item.title,
      summary: item.summary,
      content: item.content,
      createdAt: new Date(item.created_at ?? Date.now()).getTime(),
    }));

    return NextResponse.json(posts);
  } catch (err) {
    console.error('Blog API error:', err);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic } = body as { topic?: string };

    const prompt = topic
      ? `请写一篇关于"${topic}"的恋爱沟通技巧文章，风格轻松幽默，适合恋爱中的年轻人阅读。
文章要点：
1. 围绕主题展开，给出实用的沟通建议
2. 用生动的例子和比喻说明问题
3. 结尾要温馨鼓励

要求：300-500字，口语化，像朋友聊天一样，可以适当用emoji增加趣味感。`
      : `请写一篇关于恋爱沟通技巧的文章，风格轻松幽默，适合恋爱中的年轻人阅读。
可以从以下角度选择一个：
- 吵架之后如何打破僵局
- 怎样表达不满不伤感情
- 如何正确表达爱意
- 处理异地恋沟通问题
- 应对对象的无理取闹

要求：300-500字，口语化，像朋友聊天一样，可以适当用emoji增加趣味感。`;

    const config = new Config();
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const client = new LLMClient(config, customHeaders);

    const messages = [{ role: 'user' as const, content: prompt }];
    const response = await client.invoke(messages, { temperature: 0.8 });

    const content = response.content || '';
    const summary = content.slice(0, 100) + '...';

    const titleMatch = content.match(/^(.+?)[\n。！？]/);
    const title = topic || titleMatch?.[1]?.trim() || '恋爱沟通技巧分享';

    const db = getDb();
    const [data] = await db
      .insert(blogPosts)
      .values({
        title,
        summary,
        content,
      })
      .returning();

    if (!data) {
      return NextResponse.json({ error: '保存文章失败' }, { status: 500 });
    }

    const newPost: BlogPost = {
      id: data.id.toString(),
      title: data.title,
      summary: data.summary,
      content: data.content,
      createdAt: new Date(data.created_at ?? Date.now()).getTime(),
    };

    return NextResponse.json(newPost);
  } catch (err) {
    console.error('Generate article error:', err);
    return NextResponse.json({ error: '生成文章失败' }, { status: 500 });
  }
}
