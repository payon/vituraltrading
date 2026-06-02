/**
 * 감사 로그 API
 * GET: 로그 조회
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAuditLogs, getUserAuditSummary, detectSuspiciousActivity } from '@/lib/services/audit-log';
import { AuditAction } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') as AuditAction | null;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const type = searchParams.get('type'); // 'summary', 'suspicious', 'logs'
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // 요약 정보 요청
    if (type === 'summary') {
      const result = await getUserAuditSummary(session.user.id);
      return NextResponse.json(result);
    }
    
    // 의심스러운 활동 확인
    if (type === 'suspicious') {
      const result = await detectSuspiciousActivity(session.user.id);
      return NextResponse.json(result);
    }
    
    // 로그 목록 조회
    const result = await getAuditLogs({
      userId: session.user.id,
      action: action || undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit,
      offset,
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Audit logs API error:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
