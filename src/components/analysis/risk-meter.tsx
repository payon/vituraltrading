'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle,
  TrendingDown,
  Gauge
} from 'lucide-react';
import { COLORS } from '@/lib/trading';

interface RiskMetrics {
  standardDeviation: number;
  sharpeRatio: number;
  maxDrawdown: number;
  riskLevel: '안전' | '보통' | '위험';
  riskScore: number;
}

interface RiskMeterProps {
  data: RiskMetrics;
}

export function RiskMeter({ data }: RiskMeterProps) {
  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">리스크 분석</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            리스크 데이터가 없습니다
          </div>
        </CardContent>
      </Card>
    );
  }

  // 리스크 등급별 색상 및 아이콘
  const getRiskStyle = (level: '안전' | '보통' | '위험') => {
    switch (level) {
      case '안전':
        return {
          color: 'rgb(34, 197, 94)',
          bgColor: 'bg-green-100 dark:bg-green-900/20',
          textColor: 'text-green-600 dark:text-green-400',
          borderColor: 'border-green-500',
          Icon: ShieldCheck,
        };
      case '보통':
        return {
          color: 'rgb(234, 179, 8)',
          bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
          textColor: 'text-yellow-600 dark:text-yellow-400',
          borderColor: 'border-yellow-500',
          Icon: Shield,
        };
      case '위험':
        return {
          color: 'rgb(239, 68, 68)',
          bgColor: 'bg-red-100 dark:bg-red-900/20',
          textColor: 'text-red-600 dark:text-red-400',
          borderColor: 'border-red-500',
          Icon: ShieldAlert,
        };
    }
  };

  const riskStyle = getRiskStyle(data.riskLevel);
  const RiskIcon = riskStyle.Icon;

  // 프로그레스 바 색상
  const getProgressColor = (score: number) => {
    if (score < 30) return 'bg-green-500';
    if (score < 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // MDD 색상
  const getMddColor = (mdd: number) => {
    if (mdd < 10) return COLORS.RISE;
    if (mdd < 20) return 'rgb(234, 179, 8)';
    return COLORS.FALL;
  };

  // 샤프 비율 평가
  const getSharpeEvaluation = (sharpe: number) => {
    if (sharpe >= 1) return { text: '우수', color: 'text-green-600' };
    if (sharpe >= 0.5) return { text: '보통', color: 'text-yellow-600' };
    return { text: '개선필요', color: 'text-red-600' };
  };

  const sharpeEval = getSharpeEvaluation(data.sharpeRatio);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Gauge className="w-5 h-5" />
          리스크 분석
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 리스크 등급 */}
        <div className={`p-4 rounded-lg border-2 ${riskStyle.borderColor} ${riskStyle.bgColor}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <RiskIcon className={`w-6 h-6 ${riskStyle.textColor}`} />
              <span className="font-bold text-lg">리스크 등급</span>
            </div>
            <Badge 
              variant="outline" 
              className={`text-lg px-3 py-1 ${riskStyle.textColor}`}
              style={{ borderColor: riskStyle.color }}
            >
              {data.riskLevel}
            </Badge>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>리스크 점수</span>
              <span className="font-medium">{data.riskScore.toFixed(1)} / 100</span>
            </div>
            <Progress 
              value={data.riskScore} 
              className="h-2"
            />
          </div>
        </div>

        {/* 리스크 지표들 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* 표준편차 */}
          <div className="p-3 rounded-lg border bg-muted/30">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">표준편차</span>
            </div>
            <p className="text-xl font-bold">{data.standardDeviation.toFixed(2)}%</p>
            <p className="text-xs text-muted-foreground mt-1">
              {data.standardDeviation < 1 ? '낮은 변동성' : data.standardDeviation < 2 ? '보통 변동성' : '높은 변동성'}
            </p>
          </div>

          {/* 샤프 지수 */}
          <div className="p-3 rounded-lg border bg-muted/30">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">샤프 지수</span>
            </div>
            <p className="text-xl font-bold">{data.sharpeRatio.toFixed(2)}</p>
            <p className={`text-xs mt-1 ${sharpeEval.color}`}>
              {sharpeEval.text}
            </p>
          </div>

          {/* 최대 낙폭 */}
          <div className="p-3 rounded-lg border bg-muted/30">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">최대 낙폭 (MDD)</span>
            </div>
            <p 
              className="text-xl font-bold"
              style={{ color: getMddColor(data.maxDrawdown) }}
            >
              -{data.maxDrawdown.toFixed(2)}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {data.maxDrawdown < 10 ? '낮은 리스크' : data.maxDrawdown < 20 ? '중간 리스크' : '높은 리스크'}
            </p>
          </div>
        </div>

        {/* 리스크 설명 */}
        <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
          {data.riskLevel === '안전' && (
            <p>안정적인 포트폴리오입니다. 낮은 변동성으로 꾸준한 수익을 추구합니다.</p>
          )}
          {data.riskLevel === '보통' && (
            <p>균형 잡힌 포트폴리오입니다. 적절한 리스크와 수익률의 균형을 유지합니다.</p>
          )}
          {data.riskLevel === '위험' && (
            <p>높은 리스크 포트폴리오입니다. 분산 투자를 통해 리스크를 낮추는 것을 권장합니다.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
