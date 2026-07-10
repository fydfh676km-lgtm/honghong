import { NextRequest, NextResponse } from 'next/server';
import { sessions } from '../chat/route';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json({ error: '缺少会话ID' }, { status: 400 });
    }

    const session = sessions.get(sessionId);
    if (!session) {
      return NextResponse.json({ error: '会话不存在' }, { status: 404 });
    }

    // 提取踩雷消息
    const trapMessages = session.messages.filter(msg => msg.role === 'user' && msg.isTrap);

    if (trapMessages.length === 0) {
      // 如果没有明确标记的踩雷消息，分析可能导致失败的消息
      const problematicMessages = session.messages
        .filter(msg => msg.role === 'user')
        .filter(msg => msg.angerChange && msg.angerChange > 5)
        .slice(0, 5);

      return NextResponse.json({
        trapMessages: problematicMessages.map(msg => ({
          content: msg.content,
          reason: '这句话让她/他更生气了',
          suggestion: '尝试用更温和的语气表达',
        })),
        totalRounds: session.messages.filter(msg => msg.role === 'user').length,
        duration: Date.now() - session.messages[0]?.timestamp || 0,
      });
    }

    // 使用LLM分析踩雷原因和改进建议
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const client = new LLMClient(config, customHeaders);

    const roleLabel = session.roleType === 'girlfriend' ? '女友' : '男友';

    const analysisPrompt = `作为一个情感沟通专家，请分析以下对话中用户踩雷的原因，并给出改进建议。

用户角色：正在哄${roleLabel}
场景：${session.customScenario || getScenarioDescription(session.scenario)}

以下是用户说的话，请逐一分析：

${trapMessages.map(msg => `- "${msg.content}"`).join('\n')}

请对每一句话给出：
1. 踩雷原因：为什么这句话会让她/他更生气
2. 改进建议：应该怎么说更好

请用简洁、实用的方式回复，格式为：
句子: "xxx"
踩雷原因: xxx
改进建议: xxx

`;

    const response = await client.invoke([
      { role: 'user', content: analysisPrompt },
    ], {
      model: 'doubao-seed-1-8-251228',
      temperature: 0.7,
    });

    // 解析LLM的分析结果
    const analysisText = response.content;
    const analysisBlocks = analysisText.split(/句子:/).filter(Boolean);

    const analyzedMessages = trapMessages.map((msg, index) => {
      const block = analysisBlocks[index] || '';
      const reasonMatch = block.match(/踩雷原因[:\s]+(.+?)(?=改进建议|$)/);
      const suggestionMatch = block.match(/改进建议[:\s]+(.+)/);

      return {
        content: msg.content,
        reason: reasonMatch?.[1]?.trim() || '这句话让她/他更生气了',
        suggestion: suggestionMatch?.[1]?.trim() || '尝试用更温和的语气表达',
      };
    });

    return NextResponse.json({
      trapMessages: analyzedMessages,
      totalRounds: session.messages.filter(msg => msg.role === 'user').length,
      duration: Date.now() - session.messages[0]?.timestamp || 0,
    });

  } catch (error) {
    console.error('Review API error:', error);
    return NextResponse.json({ error: '复盘分析失败' }, { status: 500 });
  }
}

function getScenarioDescription(scenarioId: string): string {
  const scenarios: Record<string, string> = {
    gf_a: '忘记纪念日',
    gf_b: '和其他女生聊天被发现',
    gf_c: '消息不回、打电话不接',
    gf_d: '答应的事情没做到',
    gf_e: '说了让她难过的话',
    gf_f: '出去玩不带她、玩手机不理她',
    gf_g: '提起前任或留着前任联系方式',
    gf_h: '在她家人面前表现不好',
    gf_i: '嫌她买东西多或太抠门',
    gf_j: '放鸽子或迟到',
    gf_k: '不介绍给朋友、装单身',
    gf_l: '手机不让她看',
    gf_m: '拿她和其他人比较',
    gf_n: '生活习惯让她受不了',
    gf_o: '睡觉时忽略她',
    gf_p: '她不开心时还在讲道理',
    bf_a: '打断他玩游戏',
    bf_b: '和其他男生聊天被发现',
    bf_c: '管太严、限制自由',
    bf_d: '答应的事情没做到',
    bf_e: '说了伤他自尊的话',
    bf_f: '不让他和兄弟聚会',
    bf_g: '提起前任或留着前任联系方式',
    bf_h: '在他家人面前表现不好',
    bf_i: '花钱太多或不合理',
    bf_j: '放鸽子或迟到',
    bf_k: '不介绍给朋友、装单身',
    bf_l: '不信任他、查手机',
    bf_m: '拿他和其他人比较',
    bf_n: '不尊重他的爱好',
    bf_o: '他累的时候还闹情绪',
    bf_p: '翻旧账',
  };
  return scenarios[scenarioId] || '发生了一些矛盾';
}