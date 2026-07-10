// 哄哄模拟器 - 类型定义

// 角色类型
export type RoleType = 'girlfriend' | 'boyfriend';

// 性格类型
export type PersonalityType = 
  | 'tsundere' // 傲娇型
  | 'straightforward' // 直球型
  | 'silent' // 冷暴力型(女友)
  | 'princess' // 小公主型(女友)
  | 'rational' // 理性型(女友)
  | 'sensitive' // 敏感型
  | 'explosive' // 暴躁型
  | 'silent_male' // 闷葫芦型
  | 'straight_male' // 直男型
  | 'cold' // 冷漠型(男友)
  | 'dominant' // 霸道型
  | 'rational_male' // 琅性型(男友)
  | 'childish' // 小孩子气型
  | 'suppressed'; // 压抑型(男友)

// 音色类型
export type VoiceType = string;

// 游戏状态
export type GameState = 'setup' | 'playing' | 'success' | 'failed';

// 场景
export interface Scenario {
  id: string;
  roleType: RoleType;
  title: string;
  description: string;
  trigger: string;
}

// 性格配置
export interface PersonalityConfig {
  id: PersonalityType;
  name: string;
  description: string;
  sensitivity: { min: number; max: number }; // 敏感度（踩雷时怒气值上涨范围）
  forgiveness: { min: number; max: number } | 'conditional'; // 原谅度（哄好时怒气值下降范围）
  roleType: RoleType;
}

// 音色配置
export interface VoiceConfig {
  id: string;
  name: string;
  description: string;
  speakerId: string; // TTS speaker ID
  roleType: RoleType;
}

// 游戏配置
export interface GameConfig {
  roleType: RoleType;
  scenario: Scenario | null;
  customScenario: string | null;
  personality: PersonalityConfig;
  voice: VoiceConfig;
}

// 消息
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  audioUrl?: string;
  angerChange?: number; // 怒气值变化
  timestamp: number;
  isTrap?: boolean; // 是否踩雷
}

// 游戏会话
export interface GameSession {
  id: string;
  config: GameConfig;
  messages: Message[];
  angerLevel: number; // 当前怒气值 0-100
  state: GameState;
  startTime: number;
  trapMessages: Message[]; // 踩雷的消息列表（用于复盘）
}

// API请求类型
export interface ChatRequest {
  sessionId: string;
  userMessage: string;
  audioBase64?: string; // 用户语音的base64
}

export interface ChatResponse {
  assistantMessage: string;
  audioUrl?: string;
  angerLevel: number;
  angerChange: number;
  state: GameState;
  isTrap: boolean;
  trapReason?: string;
}

export interface SetupRequest {
  roleType: RoleType;
  scenarioId?: string;
  customScenario?: string;
  personalityId: PersonalityType;
  voiceId: string;
}

export interface SetupResponse {
  sessionId: string;
  initialMessage: string;
  initialAudioUrl?: string;
  initialAngerLevel: number;
}

export interface ReviewResponse {
  trapMessages: Array<{
    content: string;
    reason: string;
    suggestion: string;
  }>;
  totalRounds: number;
  duration: number; // 毫秒
}

// 成功反馈
export interface SuccessFeedback {
  animationType: 'celebration';
  message: string;
  audioUrl?: string;
  stats: {
    totalRounds: number;
    duration: number;
    effectivePhrases: number;
  };
}

// 失败反馈
export interface FailureFeedback {
  animationType: 'fade';
  message: string;
  showReview: boolean;
}

// 博客文章类型
export interface BlogPost {
  id: string;
  title: string;
  summary: string;
  content: string;
  createdAt: number;
}