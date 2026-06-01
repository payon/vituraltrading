'use client';

import { useState } from 'react';
import {
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { COLORS } from '@/lib/trading';

interface IndexData {
  date: string;
  value: number;
  change: number;
  changeRate: number;
  cumulativeReturn: number;
}

interface BenchmarkData {
  indices: {
    kospi: { name: string; value: number; change: number; changeRate: number };
    kosdaq: { name: string; value: number; change: number; changeRate: number };
    sp500: { name: string; value: number; change: number; changeRate: number };
  };
  historicalData: {
    kospi: IndexData[];
    kosdaq: IndexData[];
    sp500: IndexData[];
  };
  periodReturns: {
    kospi: { '1w': number; '1m': number; '3m': number; '1y': number };
    kosdaq: { '1w': number; '1m': number; '3m': number; '1y': number };
    sp500: { '1w': number; '1m': number; '3m': number; '1y': number };
  };
}

interface PortfolioReturnData {
  daily: Array<{ date: string; cumulativeReturn: number }>;
}

interface BenchmarkComparisonProps {
  benchmarkData: BenchmarkData;
  portfolioReturn?: number;
  portfolioData?: PortfolioReturnData;
}

// 지수별 색상
const INDEX_COLORS = {
  kospi: 'rgb(59, 130, 246)',   // 파랑
  kosdaq: 'rgb(16, 185, 129)',  // 초록
  sp500: 'rgb(139, 92, 246)',   // 보라
  portfolio: COLORS.RISE,       // 빨강
};

// 커스텀 툴팁 - 컴포넌트 외부로 이동
function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 border rounded-lg shadow-lg p-3">
        <p className="text-sm text-muted-foreground mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p 
            key={index} 
            className="text-sm"
            style={{ color: entry.color }}
          >
            {entry.name}: {entry.value?.toFixed(2)}%
          </p>
        ))}
      </div>
    );
  }
  return null;
}

export function BenchmarkComparison({ benchmarkData, portfolioReturn = 0, portfolioData }: BenchmarkComparisonProps) {
  const [period, setPeriod] = useState<'1w' | '1m' | '3m' | '1y'>('1m');
  const [showKospi, setShowKospi] = useState(true);
  const [showKosdaq, setShowKosdaq] = useState(true);
  const [showSp500, setShowSp500] = useState(false);
  const [showPortfolio, setShowPortfolio] = useState(true);

  if (!benchmarkData || !benchmarkData.historicalData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">벤치마크 비교</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            벤치마크 데이터가 없습니다
          </div>
        </CardContent>
      </Card>
    );
  }

  // 차트 데이터 생성
  const chartData = benchmarkData.historicalData.kospi.map((item, index) => ({
    date: item.date,
    kospi: benchmarkData.historicalData.kospi[index]?.cumulativeReturn || 0,
    kosdaq: benchmarkData.historicalData.kosdaq[index]?.cumulativeReturn || 0,
    sp500: benchmarkData.historicalData.sp500[index]?.cumulativeReturn || 0,
    portfolio: portfolioData?.daily[index]?.cumulativeReturn || 0,
  }));

  // 현재 지수 표시
  const currentIndex = (type: 'kospi' | 'kosdaq' | 'sp500') => {
    const idx = benchmarkData.indices[type];
    const color = idx.changeRate >= 0 ? COLORS.RISE : COLORS.FALL;
    return (
      <div className="flex items-center gap-2">
        <Checkbox 
          id={type} 
          checked={type === 'kospi' ? showKospi : type === 'kosdaq' ? showKosdaq : showSp500}
          onCheckedChange={(checked) => {
            if (type === 'kospi') setShowKospi(!!checked);
            else if (type === 'kosdaq') setShowKosdaq(!!checked);
            else setShowSp500(!!checked);
          }}
        />
        <div className="flex items-center gap-1">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: INDEX_COLORS[type] }}
          />
          <span className="text-sm">{idx.name}</span>
          <span className="text-sm font-medium">{idx.value.toLocaleString()}</span>
          <span className="text-sm" style={{ color }}>
            {idx.changeRate >= 0 ? '+' : ''}{idx.changeRate.toFixed(2)}%
          </span>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <CardTitle className="text-lg">벤치마크 비교</CardTitle>
          <Tabs value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
            <TabsList className="h-8">
              <TabsTrigger value="1w" className="text-xs px-3">1주</TabsTrigger>
              <TabsTrigger value="1m" className="text-xs px-3">1개월</TabsTrigger>
              <TabsTrigger value="3m" className="text-xs px-3">3개월</TabsTrigger>
              <TabsTrigger value="1y" className="text-xs px-3">1년</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        {/* 현재 지수 및 포트폴리오 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
          {currentIndex('kospi')}
          {currentIndex('kosdaq')}
          {currentIndex('sp500')}
          <div className="flex items-center gap-2">
            <Checkbox 
              id="portfolio" 
              checked={showPortfolio}
              onCheckedChange={(checked) => setShowPortfolio(!!checked)}
            />
            <div className="flex items-center gap-1">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: INDEX_COLORS.portfolio }}
              />
              <span className="text-sm">내 포트폴리오</span>
              <span 
                className="text-sm font-medium"
                style={{ color: portfolioReturn >= 0 ? COLORS.RISE : COLORS.FALL }}
              >
                {portfolioReturn >= 0 ? '+' : ''}{portfolioReturn.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        {/* 기간별 수익률 비교 */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="outline" className="gap-1">
            코스피 {period}: {benchmarkData.periodReturns.kospi[period].toFixed(2)}%
          </Badge>
          <Badge variant="outline" className="gap-1">
            코스닥 {period}: {benchmarkData.periodReturns.kosdaq[period].toFixed(2)}%
          </Badge>
          <Badge variant="outline" className="gap-1">
            S&P500 {period}: {benchmarkData.periodReturns.sp500[period].toFixed(2)}%
          </Badge>
        </div>

        {/* 차트 */}
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis 
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {showKospi && (
                <Line
                  type="monotone"
                  dataKey="kospi"
                  name="코스피"
                  stroke={INDEX_COLORS.kospi}
                  strokeWidth={2}
                  dot={false}
                />
              )}
              {showKosdaq && (
                <Line
                  type="monotone"
                  dataKey="kosdaq"
                  name="코스닥"
                  stroke={INDEX_COLORS.kosdaq}
                  strokeWidth={2}
                  dot={false}
                />
              )}
              {showSp500 && (
                <Line
                  type="monotone"
                  dataKey="sp500"
                  name="S&P500"
                  stroke={INDEX_COLORS.sp500}
                  strokeWidth={2}
                  dot={false}
                />
              )}
              {showPortfolio && (
                <Line
                  type="monotone"
                  dataKey="portfolio"
                  name="내 포트폴리오"
                  stroke={INDEX_COLORS.portfolio}
                  strokeWidth={2}
                  dot={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
