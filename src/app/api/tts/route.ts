import { NextRequest, NextResponse } from 'next/server';
import { TTSClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, speakerId } = body;

    if (!text) {
      return NextResponse.json({ error: '缺少文本内容' }, { status: 400 });
    }

    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const ttsClient = new TTSClient(config, customHeaders);

    const response = await ttsClient.synthesize({
      uid: `user_${Date.now()}`,
      text,
      speaker: speakerId || 'zh_female_xiaohe_uranus_bigtts',
      audioFormat: 'mp3',
      sampleRate: 24000,
    });

    return NextResponse.json({
      audioUrl: response.audioUri,
      audioSize: response.audioSize,
    });

  } catch (error) {
    console.error('TTS API error:', error);
    return NextResponse.json({ error: '语音合成失败' }, { status: 500 });
  }
}