import { NextResponse } from 'next/server';

export async function POST() {
  // 客户端清除localStorage即可
  return NextResponse.json({
    success: true,
    message: '已退出登录',
  });
}