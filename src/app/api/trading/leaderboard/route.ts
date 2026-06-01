/**
 * 수익률 랭킹 API
 * - 전체 사용자 수익률 랭킹
 * - 주간/월간 랭킹
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// 랭킹 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'all'; // all, weekly, monthly
    const limit = parseInt(searchParams.get('limit') || '20');

    // 모든 사용자 조회
    const users = await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        initialBalance: true,
        currentBalance: true,
        investmentStyle: true,
        createdAt: true,
      },
      orderBy: {
        currentBalance: 'desc',
      },
    });

    // 수익률 계산 및 랭킹 생성
    let rankings = users.map((user, index) => {
      const initialBalance = user.initialBalance || 10000000;
      const currentBalance = user.currentBalance || 10000000;
      const returnRate = ((currentBalance - initialBalance) / initialBalance) * 100;
      const profit = currentBalance - initialBalance;

      return {
        rank: index + 1,
        id: user.id,
        name: user.name || '익명',
        email: user.email.replace(/(.{2}).+(@.+)/, '$1***$2'), // 이메일 마스킹
        initialBalance,
        currentBalance,
        profit,
        returnRate,
        investmentStyle: user.investmentStyle || 'moderate',
      };
    });

    // 수익률 기준 정렬
    rankings.sort((a, b) => b.returnRate - a.returnRate);
    rankings = rankings.map((item, index) => ({ ...item, rank: index + 1 }));

    // 기간 필터링 (현재는 전체만 지원)
    // 추후 거래 내역 기반으로 주간/월간 수익률 계산 가능

    // 상위 N명만 반환
    rankings = rankings.slice(0, limit);

    // 내 랭킹 찾기 (기본 사용자)
    const myRanking = rankings.find(r => r.id === 'default-user');

    return NextResponse.json({
      rankings,
      myRanking,
      total: users.length,
    });
  } catch (error) {
    console.error('Failed to fetch leaderboard:', error);
    return NextResponse.json(
      { error: '랭킹을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
