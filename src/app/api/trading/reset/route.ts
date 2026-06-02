/**
 * 계좌 초기화 API
 * - 포트폴리오 삭제
 * - 거래 내역 삭제
 * - 잔고 초기화
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// 기본 사용자 ID (임시)
const DEFAULT_USER_ID = 'default-user';

// 계좌 초기화
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { initialBalance = 10000000 } = body;

    // 트랜잭션으로 처리
    await db.$transaction([
      // 포트폴리오 삭제
      db.portfolio.deleteMany({
        where: { userId: DEFAULT_USER_ID },
      }),
      // 거래 내역 삭제
      db.transaction.deleteMany({
        where: { userId: DEFAULT_USER_ID },
      }),
      // 잔고 초기화
      db.user.update({
        where: { id: DEFAULT_USER_ID },
        data: {
          initialBalance,
          currentBalance: initialBalance,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: '계좌가 초기화되었습니다.',
      initialBalance,
    });
  } catch (error) {
    console.error('Failed to reset account:', error);
    return NextResponse.json(
      { error: '계좌 초기화에 실패했습니다.' },
      { status: 500 }
    );
  }
}
