/**
 * 예약 주문 API
 * - GET: 예약 주문 목록
 * - POST: 예약 주문 생성
 * - DELETE: 예약 주문 취소
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const DEFAULT_USER_ID = 'default-user';

// 예약 주문 목록
export async function GET() {
  try {
    const orders = await db.pendingOrder.findMany({
      where: { 
        userId: DEFAULT_USER_ID,
        status: 'PENDING',
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Failed to fetch pending orders:', error);
    return NextResponse.json(
      { error: '예약 주문을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

// 예약 주문 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { symbol, name, assetType, orderType, price, quantity } = body;

    if (!symbol || !name || !orderType || !price || !quantity) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      );
    }

    const totalAmount = price * quantity;

    const order = await db.pendingOrder.create({
      data: {
        userId: DEFAULT_USER_ID,
        symbol,
        name,
        assetType: assetType || 'STOCK',
        orderType,
        price,
        quantity,
        totalAmount,
        status: 'PENDING',
      },
    });

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    console.error('Failed to create pending order:', error);
    return NextResponse.json(
      { error: '예약 주문 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// 예약 주문 취소
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: '주문 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    await db.pendingOrder.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to cancel pending order:', error);
    return NextResponse.json(
      { error: '예약 주문 취소에 실패했습니다.' },
      { status: 500 }
    );
  }
}
