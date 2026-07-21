import { SupabaseClient } from '@supabase/supabase-js';
import { invokeLLM } from '../src/lib/llm';
import { randomUUID } from 'crypto';
import { getSupabaseClient } from '../src/storage/database/supabase-client';

// 文章主题配置
const articles = [
  {
    slug: 'golden-30-minutes-after-argument',
    title: '吵架之后的黄金30分钟',
    category: '沟通技巧',
    tags: ['吵架', '道歉', '沟通']
  },
  {
    slug: 'why-you-are-right-is-the-worst-reply',
    title: '为什么「你说得对」是最烂的回复',
    category: '沟通技巧',
    tags: ['回复', '沟通', '道歉']
  },
  {
    slug: 'correct-way-to-apologize',
    title: '道歉的正确打开方式',
    category: '沟通技巧',
    tags: ['道歉', '和解', '沟通']
  },
  {
    slug: 'why-emotions-block-reason',
    title: '为什么情绪上头不能讲道理',
    category: '沟通技巧',
    tags: ['情绪', '沟通', '心理']
  }
];

// 生成文章内容的prompt
function generatePrompt(title: string): string {
  return `请写一篇关于"${title}"的恋爱沟通技巧文章。

要求：
1. 风格轻松幽默，适合年轻人阅读
2. 字数300-500字
3. 包含实用的建议和技巧
4. 可以加入一些生动的例子或比喻
5. 结尾要有鼓励性的话语

请直接输出文章正文内容，不需要标题和任何格式标记。`;
}

async function generateArticleContent(title: string): Promise<string> {
  const messages = [{ role: 'user' as const, content: generatePrompt(title) }];
  const response = await invokeLLM(messages, { temperature: 0.8 });

  return response.content || '';
}

async function main() {
  // 初始化Supabase客户端
  const supabase = getSupabaseClient() as SupabaseClient;

  console.log('开始生成并插入博客文章...\n');

  for (const article of articles) {
    console.log(`正在处理: ${article.title}`);

    // 生成文章内容
    const content = await generateArticleContent(article.title);

    // 从内容中提取摘要（前100字）
    const summary = content.slice(0, 100) + (content.length > 100 ? '...' : '');

    // 插入数据库
    const { data, error } = await supabase
      .from('blog_posts')
      .insert({
        id: randomUUID(),
        title: article.title,
        slug: article.slug,
        summary: summary,
        content: content,
        category: article.category,
        tags: article.tags,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select();

    if (error) {
      console.error(`插入失败: ${article.title}`, error);
    } else {
      console.log(`✅ 成功插入: ${article.title}`);
      console.log(`   摘要: ${summary.slice(0, 50)}...\n`);
    }
  }

  console.log('所有文章处理完成！');
}

main().catch(console.error);