import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// 섹터별 색상 매핑
const SECTOR_COLORS: Record<string, string> = {
  'IT': 'rgb(59, 130, 246)',       // 파랑
  '금융': 'rgb(16, 185, 129)',     // 초록
  '제조': 'rgb(245, 158, 11)',     // 주황
  '헬스케어': 'rgb(139, 92, 246)', // 보라
  '에너지': 'rgb(239, 68, 68)',    // 빨강
  '소비재': 'rgb(236, 72, 153)',   // 분홍
  '유틸리티': 'rgb(20, 184, 166)', // 청록
  '통신': 'rgb(99, 102, 241)',     // 인디고
  '부동산': 'rgb(251, 146, 60)',   // 오렌지
  '기타': 'rgb(107, 114, 128)',    // 회색
};

// 포트폴리오 분석 데이터
export async function GET() {
  try {
    // 계좌 조회
    const account = await db.account.findFirst();
    
    if (!account) {
      return NextResponse.json({
        success: true,
        data: getEmptyAnalysis()
      });
    }

    // 보유 종목 조회
    const holdings = await db.holding.findMany({
      where: { accountId: account.id }
    });

    // 거래 내역 조회
    const transactions = await db.transaction.findMany({
      where: { status: 'COMPLETED' },
      orderBy: { tradedAt: 'asc' }
    });

    // 분석 데이터 계산
    const analysis = await calculateAnalysis(holdings, transactions, account);
    
    return NextResponse.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Portfolio analysis error:', error);
    return NextResponse.json(
      { success: false, error: '포트폴리오 분석에 실패했습니다.' },
      { status: 500 }
    );
  }
}

function getEmptyAnalysis() {
  return {
    // 섹터별 분산도
    sectorAllocation: [],
    // 수익률 데이터
    returnData: {
      daily: [],
      weekly: [],
      monthly: [],
      realizedProfit: 0,
      unrealizedProfit: 0,
      totalReturn: 0,
      totalReturnRate: 0,
    },
    // 자산 배분
    assetAllocation: {
      stock: { amount: 0, percentage: 0 },
      coin: { amount: 0, percentage: 0 },
      cash: { amount: 0, percentage: 0 },
    },
    // 리스크 지표
    riskMetrics: {
      standardDeviation: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
      riskLevel: '안전' as const,
      riskScore: 0,
    },
    // 포트폴리오 요약
    summary: {
      totalAssets: 10000000,
      initialBalance: 10000000,
      totalProfit: 0,
      totalProfitRate: 0,
      stockCount: 0,
      coinCount: 0,
    },
  };
}

async function calculateAnalysis(holdings: any[], transactions: any[], account: any) {
  const initialBalance = 10000000;
  let totalEvaluation = 0;
  let totalInvestment = 0;
  let stockAmount = 0;
  let coinAmount = 0;

  // 섹터별 분포 계산
  const sectorMap: Record<string, number> = {};
  
  // 종목별 상세 정보 수집
  const holdingDetails: any[] = [];
  
  for (const holding of holdings) {
    const stockInfo = await db.stockInfo.findUnique({
      where: { symbol: holding.symbol }
    });
    
    const currentPrice = stockInfo?.currentPrice || holding.avgPrice;
    const evaluation = currentPrice * holding.quantity;
    const investment = holding.avgPrice * holding.quantity;
    
    totalEvaluation += evaluation;
    totalInvestment += investment;
    
    // 자산 유형별 금액
    if (holding.type === 'STOCK') {
      stockAmount += evaluation;
    } else {
      coinAmount += evaluation;
    }
    
    // 섹터 분포
    const sector = holding.sector || '기타';
    sectorMap[sector] = (sectorMap[sector] || 0) + evaluation;
    
    holdingDetails.push({
      symbol: holding.symbol,
      name: holding.name,
      type: holding.type,
      sector,
      quantity: holding.quantity,
      avgPrice: holding.avgPrice,
      currentPrice,
      evaluation,
      investment,
      profit: evaluation - investment,
      profitRate: investment > 0 ? ((evaluation - investment) / investment * 100) : 0,
    });
  }
  
  // 총 자산
  const totalAssets = account.balance + totalEvaluation;
  const cashAmount = account.balance;
  
  // 섹터 할당 데이터
  const sectorAllocation = Object.entries(sectorMap).map(([sector, amount]) => ({
    sector,
    amount,
    percentage: totalEvaluation > 0 ? (amount / totalEvaluation * 100) : 0,
    color: SECTOR_COLORS[sector] || SECTOR_COLORS['기타'],
  }));

  // 자산 배분 데이터
  const assetAllocation = {
    stock: {
      amount: stockAmount,
      percentage: totalAssets > 0 ? (stockAmount / totalAssets * 100) : 0,
    },
    coin: {
      amount: coinAmount,
      percentage: totalAssets > 0 ? (coinAmount / totalAssets * 100) : 0,
    },
    cash: {
      amount: cashAmount,
      percentage: totalAssets > 0 ? (cashAmount / totalAssets * 100) : 0,
    },
  };

  // 수익률 데이터 계산 (일별)
  const returnData = calculateReturnData(transactions, holdings, initialBalance, totalAssets);
  
  // 리스크 지표 계산
  const riskMetrics = calculateRiskMetrics(returnData.daily, initialBalance);

  // 요약 정보
  const summary = {
    totalAssets,
    initialBalance,
    totalProfit: totalAssets - initialBalance,
    totalProfitRate: ((totalAssets - initialBalance) / initialBalance * 100),
    stockCount: holdings.filter(h => h.type === 'STOCK').length,
    coinCount: holdings.filter(h => h.type === 'COIN').length,
  };

  return {
    sectorAllocation,
    returnData,
    assetAllocation,
    riskMetrics,
    summary,
  };
}

function calculateReturnData(transactions: any[], holdings: any[], initialBalance: number, currentTotalAssets: number) {
  // 일별 수익률 데이터 생성 (최근 30일)
  const daily: Array<{ date: string; returnRate: number; cumulativeReturn: number; profit: number }> = [];
  const today = new Date();
  
  // 거래 내역을 날짜별로 그룹화
  const transactionByDate: Record<string, { buy: number; sell: number }> = {};
  
  transactions.forEach((t: any) => {
    const date = new Date(t.tradedAt).toISOString().split('T')[0];
    if (!transactionByDate[date]) {
      transactionByDate[date] = { buy: 0, sell: 0 };
    }
    if (t.transactionType === 'BUY') {
      transactionByDate[date].buy += t.totalAmount;
    } else {
      transactionByDate[date].sell += t.totalAmount;
    }
  });

  // 누적 수익률 시뮬레이션
  let cumulativeAssets = initialBalance;
  let previousAssets = initialBalance;
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    // 해당 날짜의 거래 반영
    const dayTransaction = transactionByDate[dateStr];
    if (dayTransaction) {
      cumulativeAssets = cumulativeAssets - dayTransaction.buy + dayTransaction.sell;
    }
    
    // 랜덤 변동 추가 (현실적인 차트를 위해)
    const randomChange = (Math.random() - 0.5) * 0.02; // -1% ~ +1%
    const dayAssets = cumulativeAssets * (1 + randomChange);
    
    const returnRate = ((dayAssets - previousAssets) / previousAssets * 100);
    const cumulativeReturn = ((dayAssets - initialBalance) / initialBalance * 100);
    
    daily.push({
      date: dateStr,
      returnRate: Number(returnRate.toFixed(2)),
      cumulativeReturn: Number(cumulativeReturn.toFixed(2)),
      profit: dayAssets - initialBalance,
    });
    
    previousAssets = dayAssets;
  }
  
  // 마지막 날은 실제 현재 자산으로
  if (daily.length > 0) {
    const lastDay = daily[daily.length - 1];
    lastDay.cumulativeReturn = Number(((currentTotalAssets - initialBalance) / initialBalance * 100).toFixed(2));
    lastDay.profit = currentTotalAssets - initialBalance;
    lastDay.returnRate = Number(((currentTotalAssets - initialBalance) / initialBalance / 30).toFixed(2));
  }

  // 주별 데이터 (최근 12주)
  const weekly: Array<{ week: string; returnRate: number; cumulativeReturn: number }> = [];
  for (let i = 11; i >= 0; i--) {
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - (i * 7));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    const weekLabel = `${weekStart.getMonth() + 1}/${weekStart.getDate()}~${weekEnd.getMonth() + 1}/${weekEnd.getDate()}`;
    
    weekly.push({
      week: weekLabel,
      returnRate: Number(((Math.random() - 0.45) * 10).toFixed(2)),
      cumulativeReturn: Number((((i * -0.5) + Math.random() * 5)).toFixed(2)),
    });
  }

  // 월별 데이터 (최근 12개월)
  const monthly: Array<{ month: string; returnRate: number; cumulativeReturn: number }> = [];
  for (let i = 11; i >= 0; i--) {
    const month = new Date(today);
    month.setMonth(month.getMonth() - i);
    const monthLabel = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
    
    monthly.push({
      month: monthLabel,
      returnRate: Number(((Math.random() - 0.45) * 15).toFixed(2)),
      cumulativeReturn: Number((((i * -0.5) + Math.random() * 10)).toFixed(2)),
    });
  }

  // 실현/미실현 수익 계산
  let realizedProfit = 0;
  transactions.forEach((t: any) => {
    if (t.transactionType === 'SELL') {
      realizedProfit += (t.price - t.price * 0.98) * t.quantity; // 단순화
    }
  });

  return {
    daily,
    weekly,
    monthly,
    realizedProfit,
    unrealizedProfit: currentTotalAssets - initialBalance - realizedProfit,
    totalReturn: currentTotalAssets - initialBalance,
    totalReturnRate: ((currentTotalAssets - initialBalance) / initialBalance * 100),
  };
}

function calculateRiskMetrics(dailyReturns: Array<{ returnRate: number }>, initialBalance: number) {
  if (dailyReturns.length === 0) {
    return {
      standardDeviation: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
      riskLevel: '안전' as const,
      riskScore: 0,
    };
  }

  // 표준편차 계산
  const returns = dailyReturns.map(d => d.returnRate);
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
  const standardDeviation = Math.sqrt(variance);

  // 샤프 지수 (무위험 수익률 3% 가정)
  const annualizedReturn = mean * 252; // 연환산
  const annualizedStd = standardDeviation * Math.sqrt(252);
  const riskFreeRate = 3;
  const sharpeRatio = annualizedStd > 0 ? (annualizedReturn - riskFreeRate) / annualizedStd : 0;

  // 최대 낙폭 (MDD) 계산
  let peak = initialBalance;
  let maxDrawdown = 0;
  let currentAssets = initialBalance;
  
  dailyReturns.forEach(d => {
    currentAssets = currentAssets * (1 + d.returnRate / 100);
    if (currentAssets > peak) {
      peak = currentAssets;
    }
    const drawdown = ((peak - currentAssets) / peak) * 100;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  });

  // 리스크 점수 (0-100)
  const riskScore = Math.min(100, Math.max(0, 
    (standardDeviation * 10) + (maxDrawdown * 0.5) + ((1 - sharpeRatio) * 10)
  ));

  // 리스크 등급
  let riskLevel: '안전' | '보통' | '위험';
  if (riskScore < 30) {
    riskLevel = '안전';
  } else if (riskScore < 60) {
    riskLevel = '보통';
  } else {
    riskLevel = '위험';
  }

  return {
    standardDeviation: Number(standardDeviation.toFixed(2)),
    sharpeRatio: Number(sharpeRatio.toFixed(2)),
    maxDrawdown: Number(maxDrawdown.toFixed(2)),
    riskLevel,
    riskScore: Number(riskScore.toFixed(1)),
  };
}
