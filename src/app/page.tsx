'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { RoleType, PersonalityConfig, VoiceConfig, Scenario, GameState, Message } from '@/types';
import {
  getScenarios,
  getPersonalityConfigs,
  getVoiceConfigs,
  girlfriendScenarios,
  boyfriendScenarios,
  girlfriendPersonalityConfigs,
  boyfriendPersonalityConfigs,
  girlfriendVoiceConfigs,
  boyfriendVoiceConfigs,
} from '@/lib/config';

export default function Home() {
  const router = useRouter();
  
  // 用户状态
  const [currentUser, setCurrentUser] = useState<{ id: number; username: string } | null>(null);

  // 获取当前用户
  useEffect(() => {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      try {
        setCurrentUser(JSON.parse(userStr));
      } catch {
        localStorage.removeItem('user');
      }
    }
  }, []);

  // 登出
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    localStorage.removeItem('user');
    setCurrentUser(null);
    router.push('/');
  };

  // 游戏状态
  const [gameState, setGameState] = useState<GameState>('setup');
  const [roleType, setRoleType] = useState<RoleType>('girlfriend');
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [customScenario, setCustomScenario] = useState('');
  const [selectedPersonality, setSelectedPersonality] = useState<PersonalityConfig | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<VoiceConfig | null>(null);
  
  // 对话状态
  const [sessionId, setSessionId] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [angerLevel, setAngerLevel] = useState(50);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // 结果状态
  const [trapMessages, setTrapMessages] = useState<Array<{ content: string; reason: string; suggestion: string }>>([]);
  const [totalRounds, setTotalRounds] = useState(0);
  const [duration, setDuration] = useState(0);
  
  // 语音状态
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  // 音频播放状态
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // 消息滚动区域引用
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // 获取配置数据
  const scenarios = getScenarios(roleType);
  const personalityConfigs = getPersonalityConfigs(roleType);
  const voiceConfigs = getVoiceConfigs(roleType);

  // 自动滚动到最新消息
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // 开始游戏
  const startGame = async () => {
    if (!selectedPersonality || !selectedVoice) {
      alert('请选择性格和音色');
      return;
    }

    if (!selectedScenario && !customScenario) {
      alert('请选择场景或自定义输入场景');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roleType,
          scenarioId: selectedScenario?.id,
          customScenario: customScenario || undefined,
          personalityId: selectedPersonality.id,
          voiceId: selectedVoice.id,
        }),
      });

      const data = await response.json();

      const initialMsgId = 'initial';
      setSessionId(data.sessionId);
      setMessages([{
        id: initialMsgId,
        role: 'assistant',
        content: data.initialMessage,
        timestamp: Date.now(),
      }]);
      setAngerLevel(data.initialAngerLevel);
      setGameState('playing');
      
      // 自动获取并播放初始消息语音
      if (selectedVoice) {
        try {
          const ttsResponse = await fetch('/api/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: data.initialMessage,
              voiceId: selectedVoice.id,
            }),
          });
          
          const ttsData = await ttsResponse.json();
          
          // 更新消息的audioUrl
          setMessages(prev => prev.map(m => 
            m.id === initialMsgId ? { ...m, audioUrl: ttsData.audioUrl } : m
          ));
          
          // 播放音频
          playAudioByUrl(initialMsgId, ttsData.audioUrl);
        } catch (error) {
          console.error('TTS failed:', error);
        }
      }
    } catch (error) {
      console.error('Failed to start game:', error);
      alert('启动失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 保存游戏记录
  const saveGameRecord = async (result: 'success' | 'failed') => {
    // 检查是否已登录
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) {
      // 未登录，提示用户
      alert('登录后可保存你的游戏记录');
      return;
    }

    try {
      const response = await fetch('/api/game-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario: selectedScenario?.title || '未知场景',
          final_score: 100 - angerLevel,
          result: result === 'success' ? '通关' : '失败',
        }),
      });

      if (response.ok) {
        alert('您的游戏记录已经保存');
      }
    } catch (error) {
      console.error('Failed to save game record:', error);
    }
  };

  // 发送消息
  const sendMessage = async () => {
    if (!inputText.trim() || isLoading || gameState !== 'playing') return;

    const userMessage = inputText.trim();
    setInputText('');
    setIsLoading(true);

    // 先添加用户消息
    const tempUserMsg: Message = {
      id: `temp_${Date.now()}`,
      role: 'user',
      content: userMessage,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          userMessage,
        }),
      });

      const data = await response.json();

      // 更新消息列表
      const assistantMsgId = `msg_${Date.now()}_assistant`;
      setMessages(prev => {
        const filtered = prev.filter(msg => msg.id !== tempUserMsg.id);
        return [
          ...filtered,
          { id: `msg_${Date.now()}_user`, role: 'user', content: userMessage, timestamp: Date.now() },
          { id: assistantMsgId, role: 'assistant', content: data.assistantMessage, angerChange: data.angerChange, timestamp: Date.now(), isTrap: data.isTrap },
        ];
      });

      setAngerLevel(data.angerLevel);

      // 自动获取并播放AI回复语音
      if (selectedVoice) {
        try {
          const ttsResponse = await fetch('/api/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: data.assistantMessage,
              voiceId: selectedVoice.id,
            }),
          });
          
          const ttsData = await ttsResponse.json();
          
          // 更新消息的audioUrl
          setMessages(prev => prev.map(m => 
            m.id === assistantMsgId ? { ...m, audioUrl: ttsData.audioUrl } : m
          ));
          
          // 播放音频
          playAudioByUrl(assistantMsgId, ttsData.audioUrl);
        } catch (error) {
          console.error('TTS failed:', error);
        }
      }

      if (data.state === 'success' || data.state === 'failed') {
        setGameState(data.state);
        if (data.state === 'failed') {
          // 获取复盘数据
          getReview();
        }
        // 保存游戏记录
        saveGameRecord(data.state);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('发送失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 播放AI回复语音
  const playAudio = async (messageId: string, audioUrl?: string) => {
    if (!audioUrl) {
      // 如果没有audioUrl，需要调用TTS生成
      const message = messages.find(m => m.id === messageId);
      if (!message || !selectedVoice) return;
      
      try {
        const response = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: message.content,
            voiceId: selectedVoice.id,
          }),
        });
        
        const data = await response.json();
        
        // 更新消息的audioUrl
        setMessages(prev => prev.map(m => 
          m.id === messageId ? { ...m, audioUrl: data.audioUrl } : m
        ));
        
        // 播放音频
        playAudioByUrl(messageId, data.audioUrl);
      } catch (error) {
        console.error('TTS failed:', error);
      }
    } else {
      playAudioByUrl(messageId, audioUrl);
    }
  };
  
  // 通过URL播放音频
  const playAudioByUrl = (messageId: string, audioUrl: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    setPlayingMessageId(messageId);
    
    audio.onended = () => {
      setPlayingMessageId(null);
    };
    
    audio.onerror = () => {
      setPlayingMessageId(null);
      console.error('Audio playback failed');
    };
    
    audio.play();
  };
  
  // 停止播放
  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlayingMessageId(null);
  };

  // 获取复盘数据
  const getReview = async () => {
    try {
      const response = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });

      const data = await response.json();
      setTrapMessages(data.trapMessages);
      setTotalRounds(data.totalRounds);
      setDuration(data.duration);
    } catch (error) {
      console.error('Failed to get review:', error);
    }
  };

  // 开始录音
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        
        // 转换为base64并发送到ASR
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Data = reader.result as string;
          const base64Audio = base64Data.split(',')[1];

          try {
            const response = await fetch('/api/asr', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ audioBase64: base64Audio }),
            });

            const data = await response.json();
            setInputText(data.text);
          } catch (error) {
            console.error('ASR failed:', error);
            alert('语音识别失败');
          }
        };

        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('无法访问麦克风');
    }
  }, []);

  // 停止录音
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  // 重置游戏
  const resetGame = () => {
    setGameState('setup');
    setSessionId('');
    setMessages([]);
    setAngerLevel(50);
    setInputText('');
    setTrapMessages([]);
    setTotalRounds(0);
    setDuration(0);
    setSelectedScenario(null);
    setCustomScenario('');
    setSelectedPersonality(null);
    setSelectedVoice(null);
  };

  // 怒气值颜色
  const getAngerColor = (level: number) => {
    if (level <= 30) return '#52C41A';
    if (level <= 60) return '#FA8C16';
    return '#FF4D4F';
  };

  // 主题色
  const themeColor = roleType === 'girlfriend' ? '#FF6B9D' : '#4A90D9';

  return (
    <main className="min-h-screen bg-[#FDF6F0] flex flex-col">
      {/* 设置页面 */}
      {gameState === 'setup' && (
        <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
          <div className="w-full max-w-2xl space-y-6">
            {/* 用户信息栏 */}
            <div className="flex justify-between items-center">
              {currentUser ? (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-blue-400 flex items-center justify-center text-white font-bold">
                    {currentUser.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium" style={{ color: themeColor }}>
                    {currentUser.username}
                  </span>
                </div>
              ) : (
                <div></div>
              )}
              <div className="flex gap-2">
                {currentUser ? (
                  <>
                    <Link href="/profile">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-gray-600"
                      >
                        我的记录
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleLogout}
                      className="text-gray-600"
                    >
                      退出登录
                    </Button>
                  </>
                ) : (
                  <>
                    <Link href="/login">
                      <Button variant="outline" size="sm" className="text-gray-600">
                        登录
                      </Button>
                    </Link>
                    <Link href="/register">
                      <Button variant="default" size="sm" style={{ backgroundColor: themeColor }}>
                        注册
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* 标题 */}
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold text-green-800">
                哄哄模拟器
              </h1>
              <p className="text-gray-600">练习哄人技巧，提升沟通能力</p>
              <div className="flex gap-3">
                <Link
                  href="/blog"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm hover:shadow-md transition-all text-sm font-medium"
                  style={{ color: themeColor }}
                >
                  <span>📚</span>
                  恋爱攻略
                </Link>
                <Link
                  href="/leaderboard"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm hover:shadow-md transition-all text-sm font-medium"
                  style={{ color: themeColor }}
                >
                  <span>🏆</span>
                  排行榜
                </Link>
              </div>
            </div>

            {/* 角色选择 */}
            <Card className="shadow-lg border-none rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg">选择角色</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Button
                    variant={roleType === 'girlfriend' ? 'default' : 'outline'}
                    className={cn(
                      'flex-1 h-12 rounded-xl text-base',
                      roleType === 'girlfriend' && 'bg-[#FF6B9D] hover:bg-[#FF6B9D]/90 text-white'
                    )}
                    onClick={() => {
                      setRoleType('girlfriend');
                      setSelectedScenario(null);
                      setSelectedPersonality(null);
                      setSelectedVoice(null);
                    }}
                  >
                    👩 女友
                  </Button>
                  <Button
                    variant={roleType === 'boyfriend' ? 'default' : 'outline'}
                    className={cn(
                      'flex-1 h-12 rounded-xl text-base',
                      roleType === 'boyfriend' && 'bg-[#4A90D9] hover:bg-[#4A90D9]/90 text-white'
                    )}
                    onClick={() => {
                      setRoleType('boyfriend');
                      setSelectedScenario(null);
                      setSelectedPersonality(null);
                      setSelectedVoice(null);
                    }}
                  >
                    👨 男友
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 场景选择 */}
            <Card className="shadow-lg border-none rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg">选择场景</CardTitle>
                <CardDescription>预设场景或自定义输入</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ScrollArea className="h-[200px] pr-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {scenarios.map(scenario => (
                      <Button
                        key={scenario.id}
                        variant={selectedScenario?.id === scenario.id ? 'default' : 'outline'}
                        className={cn(
                          'h-auto py-3 rounded-xl text-sm whitespace-normal',
                          selectedScenario?.id === scenario.id && 'bg-[#FF6B9D] hover:bg-[#FF6B9D]/90 text-white'
                        )}
                        style={selectedScenario?.id === scenario.id ? { backgroundColor: themeColor } : {}}
                        onClick={() => {
                          setSelectedScenario(scenario);
                          setCustomScenario('');
                        }}
                      >
                        {scenario.title}
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">或自定义场景：</p>
                  <Textarea
                    placeholder="描述你惹他/她生气的原因..."
                    value={customScenario}
                    onChange={(e) => {
                      setCustomScenario(e.target.value);
                      setSelectedScenario(null);
                    }}
                    className="rounded-xl min-h-[80px]"
                  />
                </div>
              </CardContent>
            </Card>

            {/* 性格选择 */}
            <Card className="shadow-lg border-none rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg">选择性格</CardTitle>
                <CardDescription>不同性格有不同的哄人难度</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {personalityConfigs.map(personality => (
                    <Button
                      key={personality.id}
                      variant={selectedPersonality?.id === personality.id ? 'default' : 'outline'}
                      className={cn(
                        'h-auto py-3 rounded-xl text-sm whitespace-normal',
                        selectedPersonality?.id === personality.id && 'text-white'
                      )}
                      style={selectedPersonality?.id === personality.id ? { backgroundColor: themeColor } : {}}
                      onClick={() => setSelectedPersonality(personality)}
                    >
                      {personality.name}
                    </Button>
                  ))}
                </div>
                {selectedPersonality && (
                  <p className="mt-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-xl">
                    {selectedPersonality.description}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* 音色选择 */}
            <Card className="shadow-lg border-none rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg">选择音色</CardTitle>
                <CardDescription>语音回复的声音风格</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {voiceConfigs.map(voice => (
                    <Button
                      key={voice.id}
                      variant={selectedVoice?.id === voice.id ? 'default' : 'outline'}
                      className={cn(
                        'h-auto py-3 rounded-xl text-sm whitespace-normal',
                        selectedVoice?.id === voice.id && 'text-white'
                      )}
                      style={selectedVoice?.id === voice.id ? { backgroundColor: themeColor } : {}}
                      onClick={() => setSelectedVoice(voice)}
                    >
                      {voice.name}
                    </Button>
                  ))}
                </div>
                {selectedVoice && (
                  <p className="mt-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-xl">
                    {selectedVoice.description}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* 开始按钮 */}
            <Button
              className="w-full h-14 rounded-2xl text-lg font-semibold shadow-lg"
              style={{ backgroundColor: themeColor }}
              onClick={startGame}
              disabled={isLoading}
            >
              {isLoading ? '正在加载...' : '开始哄人'}
            </Button>
          </div>
        </div>
      )}

      {/* 对话页面 */}
      {gameState === 'playing' && (
        <div className="flex-1 flex flex-col">
          {/* 顶部怒气值显示 */}
          <div className="bg-white shadow-sm p-4 sticky top-0 z-10">
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium" style={{ color: themeColor }}>
                  怒气值
                </span>
                <span className="text-2xl font-bold" style={{ color: getAngerColor(angerLevel) }}>
                  {angerLevel}
                </span>
              </div>
              <Progress
                value={angerLevel}
                className="h-3 rounded-full"
                style={{
                  backgroundColor: '#E5E5E5',
                }}
              />
              <div className="flex justify-between mt-1 text-xs text-gray-400">
                <span>0 (成功)</span>
                <span>100 (失败)</span>
              </div>
            </div>
          </div>

          {/* 消息列表 */}
          <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
            <div className="max-w-2xl mx-auto space-y-4">
              {messages.map(message => (
                <div
                  key={message.id}
                  className={cn(
                    'flex',
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      'max-w-[80%] rounded-2xl p-4 shadow-sm',
                      message.role === 'user'
                        ? 'bg-white'
                        : 'bg-gray-100'
                    )}
                  >
                    {message.role === 'assistant' && (
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className="text-sm font-medium"
                          style={{ color: themeColor }}
                        >
                          {roleType === 'girlfriend' ? '女友' : '男友'}
                        </span>
                        {message.angerChange !== undefined && (
                          <span
                            className={cn(
                              'text-xs px-2 py-0.5 rounded-full',
                              message.angerChange > 0
                                ? 'bg-red-100 text-red-600'
                                : 'bg-green-100 text-green-600'
                            )}
                          >
                            {message.angerChange > 0 ? `+${message.angerChange}` : message.angerChange}
                          </span>
                        )}
                        {/* 语音播放按钮 */}
                        <button
                          className={cn(
                            'text-sm px-2 py-1 rounded-full transition-colors',
                            playingMessageId === message.id
                              ? 'bg-gray-200 text-gray-600'
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-500'
                          )}
                          onClick={() => {
                            if (playingMessageId === message.id) {
                              stopAudio();
                            } else {
                              playAudio(message.id, message.audioUrl);
                            }
                          }}
                        >
                          {playingMessageId === message.id ? '🔊 播放中' : '🔈 播放'}
                        </button>
                      </div>
                    )}
                    <p className="text-base leading-relaxed">{message.content}</p>
                    {message.role === 'user' && (
                      <div className="text-xs text-gray-400 mt-1 text-right">
                        你
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-2xl p-4 shadow-sm">
                    <span className="text-gray-400 animate-pulse">正在思考...</span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* 输入区域 */}
          <div className="bg-white shadow-lg p-4 sticky bottom-0">
            <div className="max-w-2xl mx-auto">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className={cn(
                    'rounded-xl h-12 w-12',
                    isRecording && 'bg-red-100 text-red-600 hover:bg-red-100'
                  )}
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isLoading}
                >
                  {isRecording ? '⏹️' : '🎤'}
                </Button>
                <Input
                  placeholder="输入你想说的话..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 h-12 rounded-xl text-base"
                  disabled={isLoading}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                />
                <Button
                  className="rounded-xl h-12 px-6"
                  style={{ backgroundColor: themeColor }}
                  onClick={sendMessage}
                  disabled={isLoading || !inputText.trim()}
                >
                  发送
                </Button>
              </div>
              <p className="text-xs text-gray-400 mt-2 text-center">
                可以用文字或语音输入，每轮自由切换
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 成功页面 */}
      {gameState === 'success' && (
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="text-center space-y-6 max-w-md">
            <div className="text-6xl">🎉</div>
            <h1 className="text-3xl font-bold text-green-600">哄成功了！</h1>
            <p className="text-gray-600">
              {roleType === 'girlfriend' ? '她' : '他'}终于消气了，你做得很好！
            </p>
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="space-y-2">
                <p className="text-sm text-gray-500">对话统计</p>
                <p className="text-lg">
                  用了 <span className="font-bold text-green-600">{messages.filter(m => m.role === 'user').length}</span> 句话
                </p>
              </div>
            </div>
            <Button
              className="rounded-xl h-12 px-8"
              style={{ backgroundColor: themeColor }}
              onClick={resetGame}
            >
              再来一次
            </Button>
          </div>
        </div>
      )}

      {/* 失败页面 */}
      {gameState === 'failed' && (
        <div className="flex-1 flex flex-col p-4">
          <ScrollArea className="flex-1">
            <div className="max-w-2xl mx-auto space-y-6 py-4">
              {/* 失败提示 */}
              <div className="text-center space-y-4">
                <div className="text-6xl">💔</div>
                <h1 className="text-3xl font-bold text-red-600">哄失败了...</h1>
                <p className="text-gray-600">
                  {roleType === 'girlfriend' ? '她' : '他'}不想理你了
                </p>
              </div>

              {/* 复盘分析 */}
              <Card className="shadow-lg border-none rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-lg">复盘分析</CardTitle>
                  <CardDescription>
                    共进行了 {totalRounds} 轮对话
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {trapMessages.length > 0 ? (
                    trapMessages.map((trap, index) => (
                      <div key={index} className="bg-red-50 rounded-xl p-4 space-y-2">
                        <p className="text-sm font-medium text-gray-700">
                          你说："{trap.content}"
                        </p>
                        <p className="text-sm text-red-600">
                          ⚠️ 踩雷原因：{trap.reason}
                        </p>
                        <p className="text-sm text-green-600">
                          💡 改进建议：{trap.suggestion}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center">
                      没有明显的踩雷句子，可能是哄的力度不够或时间太长
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* 重试按钮 */}
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl h-12"
                  onClick={resetGame}
                >
                 换个场景
                </Button>
                <Button
                  className="flex-1 rounded-xl h-12"
                  style={{ backgroundColor: themeColor }}
                  onClick={() => {
                    // 使用相同配置重新开始
                    setGameState('playing');
                    setMessages([]);
                    setAngerLevel(50);
                    startGame();
                  }}
                >
                  再试一次
                </Button>
              </div>
            </div>
          </ScrollArea>
        </div>
      )}
    </main>
  );
}