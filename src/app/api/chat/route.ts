import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import type { Message } from '@/types';

// 存储会话数据（临时方案，实际应该用更可靠的存储）
const sessions = new Map<string, {
  messages: Message[];
  angerLevel: number;
  roleType: 'girlfriend' | 'boyfriend';
  personality: string;
  scenario: string;
  customScenario?: string;
  trapMessages: Message[];
}>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, userMessage } = body;

    if (!sessionId || !userMessage) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    const session = sessions.get(sessionId);
    if (!session) {
      return NextResponse.json({ error: '会话不存在' }, { status: 404 });
    }

    // 提取请求头
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const client = new LLMClient(config, customHeaders);

    // 构建系统提示词
    const roleLabel = session.roleType === 'girlfriend' ? '女友' : '男友';
    const personalityConfig = getPersonalityPrompt(session.personality);
    const scenarioDesc = session.customScenario || getScenarioDescription(session.scenario);

    const systemPrompt = `你是一个正在生气的${roleLabel}。你的性格是${personalityConfig}。

当前情况：${scenarioDesc}

你的怒气值现在是 ${session.angerLevel}/100。
- 怒气值100表示极度愤怒，已经无法沟通（游戏失败）
- 怒气值0表示完全平静，已经消气（游戏成功）

用户现在尝试哄你，请你做出自然的回应。

【回复规则】
1. 用自然、口语化的方式回应，不要过于书面
2. 根据你的性格特点调整语气和表达方式
3. 如果用户说的话让你觉得生气或踩雷，表现出生气的反应
4. 如果用户说的话让你觉得被理解或安慰，表现出情绪缓和的迹象
5. 回复要简洁，一般2-4句话即可
6. 在回复最后，用【怒气值变化:XX】标注怒气值变化（XX是数字，不带符号）：
   - 如果你更生气了，用【怒气增加:XX】（如【怒气增加:10】）
   - 如果你消气了，用【怒气减少:XX】（如【怒气减少:10】）
7. 如果用户踩雷了，用【踩雷原因:XXX】标注踩雷原因

【性格特点】
${personalityConfig}

请直接回应，不要过多解释。`;

    // 构建对话历史
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
    ];

    // 添加历史消息
    for (const msg of session.messages) {
      if (msg.role === 'user') {
        messages.push({ role: 'user', content: msg.content });
      } else {
        messages.push({ role: 'assistant', content: msg.content });
      }
    }

    // 添加当前用户消息
    messages.push({ role: 'user', content: userMessage });

    // 创建用户消息对象
    const userMsg: Message = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      content: userMessage,
      timestamp: Date.now(),
    };

    // 调用LLM生成回复
    const response = await client.invoke(messages, {
      model: 'doubao-seed-1-8-251228',
      temperature: 0.8,
    });

    const assistantContent = response.content;

    // 解析怒气值变化和踩雷原因
    // 支持格式: 【怒气增加:10】【怒气减少:10】【怒气值变化:+10】【怒气值变化:-10】【怒气值变化:10】
    const angerIncreaseMatch = assistantContent.match(/【怒气增加:(\d+)】/);
    const angerDecreaseMatch = assistantContent.match(/【怒气减少:(\d+)】/);
    const angerChangeMatch = assistantContent.match(/【怒气值变化:([+-]?\d+)】/);
    const trapReasonMatch = assistantContent.match(/【踩雷原因:(.+?)】/);

    let angerChange = 0;
    let trapReason = '';
    let isTrap = false;

    if (angerIncreaseMatch) {
      angerChange = parseInt(angerIncreaseMatch[1], 10);
      console.log('[Chat API] Parsed angerIncrease:', angerChange);
    } else if (angerDecreaseMatch) {
      angerChange = -parseInt(angerDecreaseMatch[1], 10);
      console.log('[Chat API] Parsed angerDecrease:', angerChange);
    } else if (angerChangeMatch) {
      angerChange = parseInt(angerChangeMatch[1], 10);
      console.log('[Chat API] Parsed angerChange:', angerChange);
    } else {
      // 如果没有明确标注，根据性格和内容简单估算
      angerChange = estimateAngerChange(userMessage, session.personality, session.angerLevel);
      console.log('[Chat API] Estimated angerChange:', angerChange);
    }

    if (trapReasonMatch) {
      trapReason = trapReasonMatch[1];
      isTrap = true;
    }

    // 清理回复内容中的标注
    let cleanContent = assistantContent
      .replace(/【怒气增加:\d+】/, '')
      .replace(/【怒气减少:\d+】/, '')
      .replace(/【怒气值变化:[+-]?\d+】/, '')
      .replace(/【踩雷原因:.+?】/, '')
      .trim();

    // 更新怒气值
    const newAngerLevel = Math.max(0, Math.min(100, session.angerLevel + angerChange));

    // 创建助手消息对象
    const assistantMsg: Message = {
      id: `msg_${Date.now()}_assistant`,
      role: 'assistant',
      content: cleanContent,
      angerChange,
      timestamp: Date.now(),
      isTrap,
    };

    // 更新会话
    session.messages.push(userMsg, assistantMsg);
    session.angerLevel = newAngerLevel;

    if (isTrap) {
      session.trapMessages.push(userMsg);
    }

    // 判断游戏状态
    let state: 'playing' | 'success' | 'failed' = 'playing';
    if (newAngerLevel <= 0) {
      state = 'success';
    } else if (newAngerLevel >= 100) {
      state = 'failed';
    }

    sessions.set(sessionId, session);

    return NextResponse.json({
      assistantMessage: cleanContent,
      angerLevel: newAngerLevel,
      angerChange,
      state,
      isTrap,
      trapReason,
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// 创建新会话的API
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { roleType, scenarioId, customScenario, personalityId, voiceId } = body;

    if (!roleType || !personalityId) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 初始怒气值（根据场景设定）
    const initialAngerLevel = 50 + Math.floor(Math.random() * 20); // 50-70之间

    sessions.set(sessionId, {
      messages: [],
      angerLevel: initialAngerLevel,
      roleType,
      personality: personalityId,
      scenario: scenarioId || 'custom',
      customScenario,
      trapMessages: [],
    });

    // 生成初始消息
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const client = new LLMClient(config, customHeaders);

    const roleLabel = roleType === 'girlfriend' ? '女友' : '男友';
    const personalityConfig = getPersonalityPrompt(personalityId);
    const scenarioDesc = customScenario || getScenarioDescription(scenarioId || '');

    const systemPrompt = `你是一个正在生气的${roleLabel}。你的性格是${personalityConfig}。

当前情况：${scenarioDesc}

你的怒气值现在是 ${initialAngerLevel}/100。

用户刚进入对话，请用一句简短的话表达你的不满情绪，开始这场对话。
回复要自然、口语化，符合你的性格特点。
回复要简洁，一般1-2句话即可。`;

    const response = await client.invoke([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: '你好，我想和你聊聊...' },
    ], {
      model: 'doubao-seed-1-8-251228',
      temperature: 0.8,
    });

    const initialMessage = response.content;

    // 添加初始消息到会话
    const session = sessions.get(sessionId);
    if (session) {
      session.messages.push({
        id: `msg_${Date.now()}_initial`,
        role: 'assistant',
        content: initialMessage,
        timestamp: Date.now(),
      });
      sessions.set(sessionId, session);
    }

    return NextResponse.json({
      sessionId,
      initialMessage,
      initialAngerLevel,
    });

  } catch (error) {
    console.error('Setup API error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// 获取性格提示词
function getPersonalityPrompt(personalityId: string): string {
  const prompts: Record<string, string> = {
    tsundere: '傲娇型 - 嘴硬心软，明明被哄到了嘴上说"哼谁要你哄"，需要反复确认才肯承认消气。回复时经常用"哼"、"我才不稀罕"等词语。',
    straightforward: '直球型 - 生气就直接说原因，哄好了就说哄好了，不藏着掖着。回复直接、坦率。',
    silent: '冷暴力型/冷漠型 - 不说话、不回应，沉默是最大的怒气。回复时简短、冷淡，甚至不回复。',
    princess: '小公主型/小孩子气型 - 要哄要宠，甜言蜜语管用，讲道理没用。回复时带着撒娇、小情绪。',
    rational: '理性型 - 要听解释、要逻辑、要解决方案。回复时会分析问题，要求具体的改进承诺。',
    sensitive: '敏感型 - 很容易生气，一句话就炸，但也容易哄好。情绪波动大，回复时情绪化。',
    explosive: '暴躁型 - 生气直接发火说话很重，但发泄完就容易消气。回复时语气激烈。',
    silent_male: '闷葫芦型 - 不说话憋着，需要主动问才知道生气原因。回复简短、含糊。',
    straight_male: '直男型 - 说不清楚为什么生气，需要引导他表达。回复时简单直接。',
    dominant: '霸道型 - 生气就要你服从/认错，需要示弱态度。回复时强势。',
    suppressed: '压抑型 - 忍着不发但心里积累，可能突然爆发。回复时表面平静但有压抑感。',
  };
  return prompts[personalityId] || '一般性格';
}

// 获取场景描述
function getScenarioDescription(scenarioId: string): string {
  const scenarios: Record<string, string> = {
    gf_a: '今天是你们在一起一周年纪念日，但你完全忘记了，还像往常一样打游戏。',
    gf_b: '她发现你在微信上和其他女生聊天，还点赞了对方的朋友圈照片。',
    gf_c: '你打游戏正嗨，她发消息你不回，打电话你也不接，过了两小时才敷衍回复。',
    gf_d: '你答应这周末陪她逛街，结果又跑去和朋友打球了。',
    gf_e: '你无意中说"你最近是不是胖了一点"，她当场就炸了。',
    gf_f: '周末你和兄弟出去玩了一天，没带她，聚会全程玩手机不理她。',
    gf_g: '她发现你手机里还留着前任的照片，甚至联系方式都没删。',
    gf_h: '昨天在她家吃饭时，你吐槽她妈妈做的菜不好吃。',
    gf_i: '她买了一件喜欢的衣服，你嫌贵说"怎么又买东西，能不能省点"',
    gf_j: '约好今天去看电影，你临时说有事取消了，其实是懒得出门。',
    gf_k: '朋友聚会时有人问你是不是单身，你竟然说是。',
    gf_l: '她想看你的手机，你突然反扣过去说"没什么好看的"',
    gf_m: '你说"你看xxx的女朋友多温柔，你怎么不像她那样"',
    gf_n: '你袜子乱扔、不洗澡就睡、打游戏到凌晨三点。',
    gf_o: '半夜她不舒服想让你陪，你却已经睡死了，还抢被子。',
    gf_p: '她明显不开心，你还在讲道理说"你冷静点，有什么好生气的"',
    bf_a: '他正在打关键的游戏比赛，你突然打断说要让他陪你看电视剧。',
    bf_b: '他发现你在微信上和其他男生聊天，还约了吃饭。',
    bf_c: '你管他太严，不让他玩游戏、限制他和朋友聚会时间。',
    bf_d: '你答应这周末陪他看电影，结果临时取消了去陪闺蜜。',
    bf_e: '你无意中说"你这工作怎么这么多年还是这样，xxx都升职了"',
    bf_f: '他好不容易和兄弟聚会，你每隔半小时就催他回家。',
    bf_g: '他发现你还留着前任的照片，甚至联系方式都没删。',
    bf_h: '在他家吃饭时，你吐槽他妈妈做的菜太油腻。',
    bf_i: '你买了一堆化妆品包包，他觉得花钱太多说了两句。',
    bf_j: '约好今天去打球，你临时说有事取消了。',
    bf_k: '朋友聚会时有人问你是不是单身，你犹豫了一下。',
    bf_l: '你不信任他，偷偷查他的手机，还追问他的行踪。',
    bf_m: '你说"你看xxx的男朋友多能赚钱，你怎么不像他那样"',
    bf_n: '他喜欢收藏模型，你嫌弃说"这东西有什么用，幼稚死了"',
    bf_o: '他刚加班回来很累，你却还闹情绪要他哄你。',
    bf_p: '每次吵架你都翻旧账，把去年的事又拿出来说。',
  };
  return scenarios[scenarioId] || '你们之间发生了一些矛盾，现在他/她正在生气。';
}

// 简单估算怒气值变化（备用）
function estimateAngerChange(message: string, personality: string, currentAnger: number): number {
  // 简单的关键词判断
  const positiveKeywords = ['对不起', '道歉', '错了', '抱歉', '原谅', '爱', '宝贝', '亲爱的', '以后不会', '改'];
  const negativeKeywords = ['你至于吗', '多大点事', '你烦不烦', '随便', '行行行', '知道了', '别闹'];

  let change = 0;

  for (const keyword of positiveKeywords) {
    if (message.includes(keyword)) {
      change -= 5;
    }
  }

  for (const keyword of negativeKeywords) {
    if (message.includes(keyword)) {
      change += 10;
    }
  }

  // 根据性格调整
  const sensitivityMap: Record<string, number> = {
    tsundere: 1.0,
    straightforward: 1.0,
    silent: 0.5,
    princess: 1.5,
    rational: 0.8,
    sensitive: 2.0,
    explosive: 1.5,
    silent_male: 0.5,
    straight_male: 1.0,
    dominant: 1.5,
    suppressed: 0.3,
  };

  const multiplier = sensitivityMap[personality] || 1.0;
  change = Math.round(change * multiplier);

  // 随机波动
  change += Math.floor(Math.random() * 5) - 2;

  return change;
}

// 导出sessions用于其他API
export { sessions };