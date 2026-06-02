/**
 * 세션 확인 API
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ authenticated: false });
    }

    return NextResponse.json({
      authenticated: true,
      user: session.user,
    });
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json(
      { error: '세션 확인 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
