// 哄哄模拟器 - 配置数据
import type { Scenario, PersonalityConfig, VoiceConfig } from '@/types';

// 女友场景池
export const girlfriendScenarios: Scenario[] = [
  { id: 'gf_a', roleType: 'girlfriend', title: '纪念日翻车', description: '忘记纪念日/生日，或送了直男礼物', trigger: '忘记重要纪念日' },
  { id: 'gf_b', roleType: 'girlfriend', title: '异性边界问题', description: '被发现和其他女生聊天、点赞、单独吃饭', trigger: '和其他女生聊天被发现' },
  { id: 'gf_c', roleType: 'girlfriend', title: '消息冷处理', description: '回消息太慢、已读不回、打游戏不接电话', trigger: '消息不回、打电话不接' },
  { id: 'gf_d', roleType: 'girlfriend', title: '承诺失信', description: '答应的事情没做到，说好戒烟/戒游戏又破戒', trigger: '答应的事情没做到' },
  { id: 'gf_e', roleType: 'girlfriend', title: '口无遮拦', description: '说了扎心的话（评价身材、对比前任、吐槽家人）', trigger: '说了让她难过的话' },
  { id: 'gf_f', roleType: 'girlfriend', title: '社交忽视', description: '和兄弟出去玩不带她，聚会全程玩手机不理她', trigger: '出去玩不带她、玩手机不理她' },
  { id: 'gf_g', roleType: 'girlfriend', title: '前任阴影', description: '被发现还留着前任照片/联系方式，或聊天时提起前任', trigger: '提起前任或留着前任联系方式' },
  { id: 'gf_h', roleType: 'girlfriend', title: '家人矛盾', description: '在她家人面前表现不好，或吐槽她家人/闺蜜', trigger: '在她家人面前表现不好' },
  { id: 'gf_i', roleType: 'girlfriend', title: '金钱态度', description: '嫌她买东西多、管钱太严、该花钱时太抠', trigger: '嫌她买东西多或太抠门' },
  { id: 'gf_j', roleType: 'girlfriend', title: '临时放鸽子', description: '约好的事情临时取消、迟到、放她鸽子', trigger: '放鸽子或迟到' },
  { id: 'gf_k', roleType: 'girlfriend', title: '社交不认领', description: '不发朋友圈、不介绍给朋友、在外装单身', trigger: '不介绍给朋友、装单身' },
  { id: 'gf_l', roleType: 'girlfriend', title: '手机隐私', description: '不让她看手机、手机反扣、消息躲着回', trigger: '手机不让她看' },
  { id: 'gf_m', roleType: 'girlfriend', title: '比较伤害', description: '"你怎么不像xxx那样"、"我妈说你应该..."', trigger: '拿她和其他人比较' },
  { id: 'gf_n', roleType: 'girlfriend', title: '生活习惯冲突', description: '不洗澡就睡、袜子乱扔、打游戏到凌晨', trigger: '生活习惯让她受不了' },
  { id: 'gf_o', roleType: 'girlfriend', title: '睡眠忽视', description: '半夜自己睡死不哄她、抢被子、打呼噜影响她', trigger: '睡觉时忽略她' },
  { id: 'gf_p', roleType: 'girlfriend', title: '情绪无视', description: '她明显不开心，用户还在讲道理/说教/让她"冷静"', trigger: '她不开心时还在讲道理' },
];

// 男友场景池
export const boyfriendScenarios: Scenario[] = [
  { id: 'bf_a', roleType: 'boyfriend', title: '游戏被打断', description: '他打游戏正嗨时被叫停、被限制玩游戏时间', trigger: '打断他玩游戏' },
  { id: 'bf_b', roleType: 'boyfriend', title: '异性边界问题', description: '被发现和其他男生聊天、点赞、单独吃饭', trigger: '和其他男生聊天被发现' },
  { id: 'bf_c', roleType: 'boyfriend', title: '过度管控', description: '管太严、太黏人、限制他的自由和爱好', trigger: '管太严、限制自由' },
  { id: 'bf_d', roleType: 'boyfriend', title: '承诺失信', description: '答应的事情没做到、说好一起做的事又推掉', trigger: '答应的事情没做到' },
  { id: 'bf_e', roleType: 'boyfriend', title: '口无遮拦', description: '说了伤自尊的话（吐槽能力、收入、外貌）', trigger: '说了伤他自尊的话' },
  { id: 'bf_f', roleType: 'boyfriend', title: '社交限制', description: '不让他和兄弟聚会、聚会时一直催他回家', trigger: '不让他和兄弟聚会' },
  { id: 'bf_g', roleType: 'boyfriend', title: '前任阴影', description: '被发现还留着前任照片/联系方式，或聊天时提起前任', trigger: '提起前任或留着前任联系方式' },
  { id: 'bf_h', roleType: 'boyfriend', title: '家人矛盾', description: '在他家人面前表现不好，或吐槽他家人/兄弟', trigger: '在他家人面前表现不好' },
  { id: 'bf_i', roleType: 'boyfriend', title: '金钱态度', description: '花钱太多、管钱方式不合理、该省的时候不省', trigger: '花钱太多或不合理' },
  { id: 'bf_j', roleType: 'boyfriend', title: '临时放鸽子', description: '约好的事情临时取消、迟到、放他鸽子', trigger: '放鸽子或迟到' },
  { id: 'bf_k', roleType: 'boyfriend', title: '社交不认领', description: '不发朋友圈、不介绍给朋友、在外装单身', trigger: '不介绍给朋友、装单身' },
  { id: 'bf_l', roleType: 'boyfriend', title: '信任问题', description: '不信任他、查手机、翻东西、追问行踪', trigger: '不信任他、查手机' },
  { id: 'bf_m', roleType: 'boyfriend', title: '比较伤害', description: '"你怎么不像xxx那样"、"我妈说你应该..."', trigger: '拿他和其他人比较' },
  { id: 'bf_n', roleType: 'boyfriend', title: '不尊重爱好', description: '嫌他的爱好幼稚、不理解他的兴趣、强行打断', trigger: '不尊重他的爱好' },
  { id: 'bf_o', roleType: 'boyfriend', title: '情绪疲惫', description: '他很累/压力大，用户还继续闹情绪要他哄', trigger: '他累的时候还闹情绪' },
  { id: 'bf_p', roleType: 'boyfriend', title: '翻旧账', description: '总翻旧账、每次吵架都提以前的事', trigger: '翻旧账' },
];

// 女友性格配置
export const girlfriendPersonalityConfigs: PersonalityConfig[] = [
  { id: 'tsundere', name: '傲娇型', description: '嘴硬心软，需要反复哄才肯承认消气', sensitivity: { min: 5, max: 10 }, forgiveness: { min: 3, max: 5 }, roleType: 'girlfriend' },
  { id: 'straightforward', name: '直球型', description: '生气就直接说，哄好了就说哄好了', sensitivity: { min: 8, max: 12 }, forgiveness: { min: 8, max: 12 }, roleType: 'girlfriend' },
  { id: 'silent', name: '冷暴力型', description: '不说话不回应，沉默是最大怒气', sensitivity: { min: 3, max: 5 }, forgiveness: { min: 1, max: 3 }, roleType: 'girlfriend' },
  { id: 'princess', name: '小公主型', description: '要哄要宠，甜言蜜语管用，讲道理没用', sensitivity: { min: 12, max: 18 }, forgiveness: { min: 12, max: 18 }, roleType: 'girlfriend' },
  { id: 'rational', name: '理性型', description: '要听解释、要逻辑、要解决方案', sensitivity: { min: 6, max: 10 }, forgiveness: 'conditional', roleType: 'girlfriend' },
  { id: 'sensitive', name: '敏感型', description: '很容易炸，但也容易哄好', sensitivity: { min: 18, max: 25 }, forgiveness: { min: 15, max: 20 }, roleType: 'girlfriend' },
  { id: 'explosive', name: '暴躁型', description: '爆发快冷却也快，发泄完就容易消气', sensitivity: { min: 15, max: 25 }, forgiveness: { min: 12, max: 18 }, roleType: 'girlfriend' },
];

// 男友性格配置
export const boyfriendPersonalityConfigs: PersonalityConfig[] = [
  { id: 'silent_male', name: '闷葫芦型', description: '不说话憋着，需要主动问才知道生气原因', sensitivity: { min: 3, max: 5 }, forgiveness: { min: 3, max: 5 }, roleType: 'boyfriend' },
  { id: 'straight_male', name: '直男型', description: '说不清楚为什么生气，需要引导他表达', sensitivity: { min: 6, max: 10 }, forgiveness: { min: 8, max: 12 }, roleType: 'boyfriend' },
  { id: 'cold', name: '冷漠型', description: '直接不理人，需要热情主动打破沉默', sensitivity: { min: 3, max: 5 }, forgiveness: { min: 1, max: 3 }, roleType: 'boyfriend' },
  { id: 'dominant', name: '霸道型', description: '生气就要你服从/认错，需要示弱态度', sensitivity: { min: 12, max: 18 }, forgiveness: { min: 8, max: 12 }, roleType: 'boyfriend' },
  { id: 'rational_male', name: '理性型', description: '要听解释、要逻辑、不想听情绪化废话', sensitivity: { min: 6, max: 10 }, forgiveness: 'conditional', roleType: 'boyfriend' },
  { id: 'childish', name: '小孩子气型', description: '生气像小孩闹脾气，需要哄需要宠', sensitivity: { min: 12, max: 18 }, forgiveness: { min: 12, max: 18 }, roleType: 'boyfriend' },
  { id: 'suppressed', name: '压抑型', description: '忍着不发但心里积累，突然爆发很严重', sensitivity: { min: 2, max: 5 }, forgiveness: { min: 8, max: 15 }, roleType: 'boyfriend' },
];

// 女友音色配置
export const girlfriendVoiceConfigs: VoiceConfig[] = [
  { id: 'gf_voice_gentle', name: '温柔型', description: '语调柔和、声音温婉、生气时带着委屈感', speakerId: 'zh_female_xiaohe_uranus_bigtts', roleType: 'girlfriend' },
  { id: 'gf_voice_lively', name: '活泼型', description: '语调跳跃、声音清脆、生气时情绪外露', speakerId: 'zh_female_vv_uranus_bigtts', roleType: 'girlfriend' },
  { id: 'gf_voice_cute', name: '撒娇型', description: '语调软糯、声音甜美、生气时带着小情绪', speakerId: 'saturn_zh_female_keainvsheng_tob', roleType: 'girlfriend' },
  { id: 'gf_voice_cold', name: '清冷型', description: '语调平稳、声音冷静、生气时语气冰冷', speakerId: 'zh_female_mizai_saturn_bigtts', roleType: 'girlfriend' },
  { id: 'gf_voice_mature', name: '成熟型', description: '语调沉稳、声音有质感、生气时带着压迫感', speakerId: 'zh_female_jitangnv_saturn_bigtts', roleType: 'girlfriend' },
];

// 男友音色配置
export const boyfriendVoiceConfigs: VoiceConfig[] = [
  { id: 'bf_voice_deep', name: '低沉型', description: '语调沉稳、声音厚重、生气时语气压低', speakerId: 'zh_male_m191_uranus_bigtts', roleType: 'boyfriend' },
  { id: 'bf_voice_clear', name: '清朗型', description: '语调清晰、声音明亮、生气时直接表达', speakerId: 'zh_male_taocheng_uranus_bigtts', roleType: 'boyfriend' },
  { id: 'bf_voice_sunny', name: '阳光型', description: '语调轻快、声音有活力、生气时带着情绪波动', speakerId: 'saturn_zh_male_shuanglangshaonian_tob', roleType: 'boyfriend' },
  { id: 'bf_voice_cold', name: '冷漠型', description: '语调冷淡、声音不带情感、生气时沉默为主', speakerId: 'zh_male_dayi_saturn_bigtts', roleType: 'boyfriend' },
  { id: 'bf_voice_young', name: '少年感型', description: '语调年轻、声音清爽、生气时带着倔强', speakerId: 'saturn_zh_male_tiancaitongzhuo_tob', roleType: 'boyfriend' },
];

// 获取场景列表
export function getScenarios(roleType: 'girlfriend' | 'boyfriend'): Scenario[] {
  return roleType === 'girlfriend' ? girlfriendScenarios : boyfriendScenarios;
}

// 获取性格配置
export function getPersonalityConfigs(roleType: 'girlfriend' | 'boyfriend'): PersonalityConfig[] {
  return roleType === 'girlfriend' ? girlfriendPersonalityConfigs : boyfriendPersonalityConfigs;
}

// 获取音色配置
export function getVoiceConfigs(roleType: 'girlfriend' | 'boyfriend'): VoiceConfig[] {
  return roleType === 'girlfriend' ? girlfriendVoiceConfigs : boyfriendVoiceConfigs;
}

// 获取单个性格配置
export function getPersonalityConfig(personalityId: string): PersonalityConfig | undefined {
  return [...girlfriendPersonalityConfigs, ...boyfriendPersonalityConfigs].find(p => p.id === personalityId);
}

// 获取单个音色配置
export function getVoiceConfig(voiceId: string): VoiceConfig | undefined {
  return [...girlfriendVoiceConfigs, ...boyfriendVoiceConfigs].find(v => v.id === voiceId);
}

// 获取单个场景
export function getScenario(scenarioId: string): Scenario | undefined {
  return [...girlfriendScenarios, ...boyfriendScenarios].find(s => s.id === scenarioId);
}