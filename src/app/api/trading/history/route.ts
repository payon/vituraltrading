import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// 거래 내역 조회
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'transactions'; // orders, transactions

    // 기본 사용자 조회
    const user = await db.user.findFirst();
    
    if (!user) {
      return NextResponse.json({
        success: true,
        data: []
      });
    }

    if (type === 'orders') {
      // 주문 내역 (대기 중인 주문)
      const orders = await db.transaction.findMany({
        where: { 
          userId: user.id,
          status: 'PENDING'
        },
        orderBy: { createdAt: 'desc' },
        take: 50
      });

      return NextResponse.json({
        success: true,
        data: orders.map(o => ({
          id: o.id,
          symbol: o.symbol,
          name: o.name,
          type: o.transactionType,
          orderType: o.orderType,
          price: o.price,
          quantity: o.quantity,
          amount: o.totalAmount,
          fee: o.fee,
          status: o.status,
          createdAt: o.createdAt
        }))
      });
    } else {
      // 체결 내역 (완료된 거래)
      const transactions = await db.transaction.findMany({
        where: { 
          userId: user.id,
          status: 'COMPLETED'
        },
        orderBy: { tradedAt: 'desc' },
        take: 100
      });

      return NextResponse.json({
        success: true,
        data: transactions.map(t => ({
          id: t.id,
          symbol: t.symbol,
          name: t.name,
          type: t.transactionType,
          orderType: t.orderType,
          price: t.price,
          quantity: t.quantity,
          amount: t.totalAmount,
          fee: t.fee,
          status: t.status,
          tradedAt: t.tradedAt
        }))
      });
    }
  } catch (error) {
    console.error('History fetch error:', error);
    return NextResponse.json(
      { success: false, error: '거래 내역을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
