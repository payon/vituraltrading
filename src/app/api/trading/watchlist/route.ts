/**
 * 관심종목 API
 * - GET: 관심종목 목록 조회
 * - POST: 관심종목 추가
 * - DELETE: 관심종목 삭제
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// 기본 사용자 ID (임시)
const DEFAULT_USER_ID = 'default-user';

// 관심종목 목록 조회
export async function GET() {
  try {
    const watchlist = await db.watchlist.findMany({
      where: { userId: DEFAULT_USER_ID },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ watchlist });
  } catch (error) {
    console.error('Failed to fetch watchlist:', error);
    return NextResponse.json(
      { error: '관심종목을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

// 관심종목 추가
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { symbol, name, assetType, priceAlertEnabled, targetPrice } = body;

    if (!symbol || !name || !assetType) {
      return NextResponse.json(
        { error: '종목 정보가 필요합니다.' },
        { status: 400 }
      );
    }

    // 이미 등록된 종목인지 확인
    const existing = await db.watchlist.findUnique({
      where: {
        userId_symbol_assetType: {
          userId: DEFAULT_USER_ID,
          symbol,
          assetType,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: '이미 관심종목에 등록되어 있습니다.' },
        { status: 400 }
      );
    }

    const watchlistItem = await db.watchlist.create({
      data: {
        userId: DEFAULT_USER_ID,
        symbol,
        name,
        assetType,
        priceAlertEnabled: priceAlertEnabled || false,
        targetPrice,
      },
    });

    return NextResponse.json({ watchlistItem }, { status: 201 });
  } catch (error) {
    console.error('Failed to add to watchlist:', error);
    return NextResponse.json(
      { error: '관심종목 추가에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// 관심종목 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: '관심종목 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    await db.watchlist.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to remove from watchlist:', error);
    return NextResponse.json(
      { error: '관심종목 삭제에 실패했습니다.' },
      { status: 500 }
    );
  }
}
