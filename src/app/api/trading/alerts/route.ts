/**
 * 가격 알림 API
 * - GET: 알림 목록
 * - POST: 알림 생성
 * - DELETE: 알림 삭제
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const DEFAULT_USER_ID = 'default-user';

// 알림 목록
export async function GET() {
  try {
    const alerts = await db.priceAlert.findMany({
      where: { userId: DEFAULT_USER_ID },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ alerts });
  } catch (error) {
    console.error('Failed to fetch alerts:', error);
    return NextResponse.json(
      { error: '알림을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

// 알림 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { symbol, name, assetType, targetPrice, condition } = body;

    if (!symbol || !name || !targetPrice || !condition) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      );
    }

    const alert = await db.priceAlert.create({
      data: {
        userId: DEFAULT_USER_ID,
        symbol,
        name,
        assetType: assetType || 'STOCK',
        targetPrice,
        condition,
        triggered: false,
      },
    });

    return NextResponse.json({ alert }, { status: 201 });
  } catch (error) {
    console.error('Failed to create alert:', error);
    return NextResponse.json(
      { error: '알림 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// 알림 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: '알림 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    await db.priceAlert.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete alert:', error);
    return NextResponse.json(
      { error: '알림 삭제에 실패했습니다.' },
      { status: 500 }
    );
  }
}
