import { NextRequest, NextResponse } from 'next/server';
import { ASRClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { audioUrl, audioBase64 } = body;

    if (!audioUrl && !audioBase64) {
      return NextResponse.json({ error: '缺少音频数据' }, { status: 400 });
    }

    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const asrClient = new ASRClient(config, customHeaders);

    const result = await asrClient.recognize({
      uid: `user_${Date.now()}`,
      url: audioUrl,
      base64Data: audioBase64,
    });

    return NextResponse.json({
      text: result.text,
      duration: result.duration,
    });

  } catch (error) {
    console.error('ASR API error:', error);
    return NextResponse.json({ error: '语音识别失败' }, { status: 500 });
  }
}