/**
 * 세션 관리 API
 * GET: 활성 세션 목록
 * DELETE: 세션 종료
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// 활성 세션 목록 조회
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }
    
    // 활성 세션 조회
    const activeSessions = await db.session.findMany({
      where: {
        userId: session.user.id,
        expires: { gte: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    // 현재 세션 토큰
    const currentToken = session.user.sessionToken || session.user.id;
    
    const formattedSessions = activeSessions.map(s => ({
      id: s.id,
      sessionToken: s.sessionToken.slice(0, 8) + '...', // 마스킹
      isCurrent: s.sessionToken === currentToken,
      createdAt: s.createdAt,
      expiresAt: s.expires,
      lastAccessed: s.updatedAt,
    }));
    
    return NextResponse.json({
      success: true,
      sessions: formattedSessions,
      total: formattedSessions.length,
    });
  } catch (error) {
    console.error('Sessions API error:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 세션 종료 (다른 기기 로그아웃)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const all = searchParams.get('all');
    
    if (all === 'true') {
      // 현재 세션 제외 모든 세션 종료
      const currentToken = session.user.sessionToken;
      
      await db.session.deleteMany({
        where: {
          userId: session.user.id,
          NOT: { sessionToken: currentToken },
        },
      });
      
      return NextResponse.json({
        success: true,
        message: '다른 모든 기기에서 로그아웃되었습니다.',
      });
    }
    
    if (sessionId) {
      // 특정 세션 종료
      const targetSession = await db.session.findUnique({
        where: { id: sessionId },
      });
      
      if (!targetSession || targetSession.userId !== session.user.id) {
        return NextResponse.json(
          { success: false, error: '세션을 찾을 수 없습니다.' },
          { status: 404 }
        );
      }
      
      await db.session.delete({
        where: { id: sessionId },
      });
      
      return NextResponse.json({
        success: true,
        message: '해당 기기에서 로그아웃되었습니다.',
      });
    }
    
    return NextResponse.json(
      { success: false, error: '요청 파라미터가 필요합니다.' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Session delete error:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
