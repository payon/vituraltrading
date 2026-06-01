import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// 포트폴리오 조회
export async function GET() {
  try {
    // 기본 사용자 조회
    const user = await db.user.findFirst();
    
    if (!user) {
      return NextResponse.json({
        success: true,
        data: { 
          holdings: [], 
          summary: {
            totalEvaluation: 0,
            totalProfit: 0,
            totalProfitRate: 0,
            totalInvestment: 0
          },
          sectorDistribution: []
        }
      });
    }

    // 포트폴리오 조회
    const portfolios = await db.portfolio.findMany({
      where: { userId: user.id }
    });

    // 보유 종목 정보 가공
    let totalEvaluation = 0;
    let totalInvestment = 0;
    
    const holdings = portfolios.map(p => {
      const currentPrice = p.currentPrice || p.buyPrice;
      const evaluation = currentPrice * p.quantity;
      const investment = p.buyPrice * p.quantity;
      const profit = evaluation - investment;
      const profitRate = p.buyPrice > 0 ? ((currentPrice - p.buyPrice) / p.buyPrice * 100) : 0;
      
      totalEvaluation += evaluation;
      totalInvestment += investment;
      
      return {
        id: p.id,
        symbol: p.symbol,
        name: p.name,
        assetType: p.assetType,
        quantity: p.quantity,
        avgPrice: p.buyPrice,
        currentPrice,
        evaluation,
        investment,
        profit,
        profitRate: Number(profitRate.toFixed(2)),
        changeRate: 0,
        weight: 0
      };
    });

    // 비중 계산
    holdings.forEach(h => {
      h.weight = totalEvaluation > 0 ? (h.evaluation / totalEvaluation * 100) : 0;
    });

    const totalProfit = totalEvaluation - totalInvestment;
    const totalProfitRate = totalInvestment > 0 ? (totalProfit / totalInvestment * 100) : 0;

    // 섹터 분포 계산
    const sectorMap = new Map<string, number>();
    for (const p of portfolios) {
      const sector = p.assetType === 'STOCK' ? '주식' : '코인';
      sectorMap.set(sector, (sectorMap.get(sector) || 0) + p.totalCost);
    }

    const sectorDistribution = Array.from(sectorMap.entries()).map(([sector, amount]) => ({
      sector,
      amount,
      percentage: totalEvaluation > 0 ? (amount / totalEvaluation * 100) : 0
    }));

    return NextResponse.json({
      success: true,
      data: {
        holdings,
        summary: {
          totalEvaluation,
          totalInvestment,
          totalProfit,
          totalProfitRate: Number(totalProfitRate.toFixed(2))
        },
        sectorDistribution
      }
    });
  } catch (error) {
    console.error('Portfolio fetch error:', error);
    return NextResponse.json(
      { success: false, error: '포트폴리오를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
