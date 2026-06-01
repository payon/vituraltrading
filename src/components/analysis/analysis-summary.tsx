'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  PiggyBank,
  BarChart3,
  Target,
  Award,
  AlertCircle
} from 'lucide-react';
import { COLORS } from '@/lib/trading';

interface SummaryData {
  totalAssets: number;
  initialBalance: number;
  totalProfit: number;
  totalProfitRate: number;
  stockCount: number;
  coinCount: number;
}

interface AnalysisSummaryProps {
  summary: SummaryData;
  riskLevel?: '안전' | '보통' | '위험';
}

export function AnalysisSummary({ summary, riskLevel = '보통' }: AnalysisSummaryProps) {
  if (!summary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">포트폴리오 요약</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            요약 데이터가 없습니다
          </div>
        </CardContent>
      </Card>
    );
  }

  const isProfit = summary.totalProfit >= 0;
  const profitColor = isProfit ? COLORS.RISE : COLORS.FALL;

  // 목표 달성률 (초기 자금 대비 10% 수익을 목표로 가정)
  const targetReturn = summary.initialBalance * 0.1;
  const achievementRate = Math.min(100, Math.max(0, (summary.totalProfit / targetReturn) * 100));

  // 리스크 등급별 색상
  const getRiskColor = (level: string) => {
    switch (level) {
      case '안전': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case '보통': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case '위험': return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // 투자 성과 평가
  const getPerformanceGrade = () => {
    if (summary.totalProfitRate >= 20) return { grade: 'A+', text: '우수', color: 'text-green-600' };
    if (summary.totalProfitRate >= 10) return { grade: 'A', text: '양호', color: 'text-green-500' };
    if (summary.totalProfitRate >= 5) return { grade: 'B+', text: '보통+', color: 'text-yellow-600' };
    if (summary.totalProfitRate >= 0) return { grade: 'B', text: '보통', color: 'text-yellow-500' };
    if (summary.totalProfitRate >= -5) return { grade: 'C', text: '주의', color: 'text-orange-500' };
    return { grade: 'D', text: '개선필요', color: 'text-red-500' };
  };

  const performance = getPerformanceGrade();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          포트폴리오 요약
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 총 자산 & 수익률 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">총 자산</span>
            </div>
            <p className="text-2xl font-bold">
              {summary.totalAssets.toLocaleString()}원
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              초기 자금: {summary.initialBalance.toLocaleString()}원
            </p>
          </div>

          <div className="p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 mb-2">
              {isProfit ? (
                <TrendingUp className="w-4 h-4" style={{ color: COLORS.RISE }} />
              ) : (
                <TrendingDown className="w-4 h-4" style={{ color: COLORS.FALL }} />
              )}
              <span className="text-sm text-muted-foreground">총 수익</span>
            </div>
            <p className="text-2xl font-bold" style={{ color: profitColor }}>
              {isProfit ? '+' : ''}{summary.totalProfit.toLocaleString()}원
            </p>
            <p className="text-sm font-medium mt-1" style={{ color: profitColor }}>
              {isProfit ? '+' : ''}{summary.totalProfitRate.toFixed(2)}%
            </p>
          </div>
        </div>

        {/* 투자 성과 등급 */}
        <div className="p-4 rounded-lg border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5" style={{ color: performance.color }} />
              <span className="font-medium">투자 성과</span>
            </div>
            <Badge 
              variant="outline" 
              className={`text-lg px-3 py-1 ${performance.color}`}
            >
              {performance.grade}
            </Badge>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{performance.text}</span>
            <span className="text-muted-foreground">목표 대비 {achievementRate.toFixed(0)}% 달성</span>
          </div>
          <Progress value={achievementRate} className="h-2 mt-2" />
        </div>

        {/* 포트폴리오 구성 */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg border text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="w-4 h-4 text-red-500" />
              <span className="text-sm text-muted-foreground">주식</span>
            </div>
            <p className="text-xl font-bold text-red-500">{summary.stockCount}</p>
            <p className="text-xs text-muted-foreground">종목</p>
          </div>

          <div className="p-3 rounded-lg border text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <PiggyBank className="w-4 h-4 text-amber-500" />
              <span className="text-sm text-muted-foreground">코인</span>
            </div>
            <p className="text-xl font-bold text-amber-500">{summary.coinCount}</p>
            <p className="text-xs text-muted-foreground">종목</p>
          </div>

          <div className="p-3 rounded-lg border text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Target className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">리스크</span>
            </div>
            <Badge className={`mt-1 ${getRiskColor(riskLevel)}`}>
              {riskLevel}
            </Badge>
          </div>
        </div>

        {/* 투자 조언 */}
        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-700 dark:text-blue-300">
              {summary.totalProfitRate < 0 ? (
                <p>현재 손실 상태입니다. 장기 투자 관점에서 포트폴리오를 점검해 보세요.</p>
              ) : summary.totalProfitRate < 5 ? (
                <p>안정적인 수익을 내고 있습니다. 분산 투자를 유지하세요.</p>
              ) : summary.totalProfitRate < 15 ? (
                <p>좋은 수익률입니다! 일부 수익 실현을 고려해 보세요.</p>
              ) : (
                <p>우수한 수익률입니다! 리밸런싱을 통해 리스크를 관리하세요.</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
