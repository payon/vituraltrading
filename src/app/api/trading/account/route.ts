import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// 계좌 정보 조회
export async function GET() {
  try {
    // 기본 사용자 조회 또는 생성 (모의투자용)
    let user = await db.user.findFirst();
    
    if (!user) {
      user = await db.user.create({
        data: {
          email: 'demo@invest.app',
          name: '데모 사용자',
          initialBalance: 10000000, // 1000만원
          currentBalance: 10000000,
        }
      });
    }
    
    // 보유 종목의 평가금액 계산
    const portfolios = await db.portfolio.findMany({
      where: { userId: user.id }
    });
    
    // 평가금액 계산
    let totalEvaluation = 0;
    let totalProfit = 0;
    let totalCost = 0;
    
    for (const portfolio of portfolios) {
      const currentPrice = portfolio.currentPrice || portfolio.buyPrice;
      const evaluation = currentPrice * portfolio.quantity;
      const profit = (currentPrice - portfolio.buyPrice) * portfolio.quantity;
      
      totalEvaluation += evaluation;
      totalProfit += profit;
      totalCost += portfolio.totalCost;
    }
    
    const totalAssets = user.currentBalance + totalEvaluation;
    const profitRate = user.initialBalance > 0 
      ? ((totalAssets - user.initialBalance) / user.initialBalance * 100) 
      : 0;
    
    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        balance: user.currentBalance,
        initialBalance: user.initialBalance,
        totalAssets,
        evaluation: totalEvaluation,
        profit: totalProfit,
        profitRate,
        stockCount: portfolios.filter(p => p.assetType === 'STOCK').length,
        coinCount: portfolios.filter(p => p.assetType === 'COIN').length,
      }
    });
  } catch (error) {
    console.error('Account fetch error:', error);
    return NextResponse.json(
      { success: false, error: '계좌 정보를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
