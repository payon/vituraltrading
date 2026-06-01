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
  Area,
  AreaChart,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { COLORS } from '@/lib/trading';

interface DailyData {
  date: string;
  returnRate: number;
  cumulativeReturn: number;
  profit: number;
}

interface WeeklyData {
  week: string;
  returnRate: number;
  cumulativeReturn: number;
}

interface MonthlyData {
  month: string;
  returnRate: number;
  cumulativeReturn: number;
}

interface ReturnData {
  daily: DailyData[];
  weekly: WeeklyData[];
  monthly: MonthlyData[];
  realizedProfit: number;
  unrealizedProfit: number;
  totalReturn: number;
  totalReturnRate: number;
}

interface ReturnLineChartProps {
  data: ReturnData;
}

// 커스텀 툴팁 - 컴포넌트 외부로 이동
function CustomTooltip({ active, payload, label, chartType, period }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 border rounded-lg shadow-lg p-3">
        <p className="text-sm text-muted-foreground mb-1">{label}</p>
        {chartType === 'cumulative' ? (
          <>
            <p className="font-medium" style={{ color: COLORS.RISE }}>
              누적 수익률: {payload[0]?.value?.toFixed(2)}%
            </p>
            {payload[0]?.payload?.profit !== undefined && (
              <p className="text-sm text-muted-foreground">
                수익금: {payload[0].payload.profit.toLocaleString()}원
              </p>
            )}
          </>
        ) : (
          <p 
            className="font-medium"
            style={{ 
              color: payload[0]?.value >= 0 ? COLORS.RISE : COLORS.FALL 
            }}
          >
            {period === 'daily' ? '일별' : period === 'weekly' ? '주별' : '월별'} 수익률: {payload[0]?.value?.toFixed(2)}%
          </p>
        )}
      </div>
    );
  }
  return null;
}

export function ReturnLineChart({ data }: ReturnLineChartProps) {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [chartType, setChartType] = useState<'cumulative' | 'daily'>('cumulative');

  // 데이터가 없는 경우
  if (!data || (!data.daily?.length && !data.weekly?.length && !data.monthly?.length)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">수익률 추이</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            수익률 데이터가 없습니다
          </div>
        </CardContent>
      </Card>
    );
  }

  // 선택된 기간에 따른 데이터
  const chartData = period === 'daily' 
    ? data.daily 
    : period === 'weekly' 
      ? data.weekly 
      : data.monthly;

  // X축 키
  const xKey = period === 'daily' ? 'date' : period === 'weekly' ? 'week' : 'month';

  // 수익률 색상 결정
  const getReturnColor = (value: number) => {
    if (value >= 0) return COLORS.RISE;
    return COLORS.FALL;
  };

  // Y축 도메인 계산
  const values = chartData.map((d: any) => chartType === 'cumulative' ? d.cumulativeReturn : d.returnRate);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const yDomain = [
    Math.floor(minValue - 2),
    Math.ceil(maxValue + 2)
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <CardTitle className="text-lg">수익률 추이</CardTitle>
          <div className="flex items-center gap-2">
            <Tabs value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
              <TabsList className="h-8">
                <TabsTrigger value="daily" className="text-xs px-3">일별</TabsTrigger>
                <TabsTrigger value="weekly" className="text-xs px-3">주별</TabsTrigger>
                <TabsTrigger value="monthly" className="text-xs px-3">월별</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* 수익 요약 */}
        <div className="flex flex-wrap gap-3 mb-4">
          <Badge 
            variant="outline" 
            className="gap-1"
            style={{ 
              borderColor: getReturnColor(data.totalReturnRate),
              color: getReturnColor(data.totalReturnRate)
            }}
          >
            총 수익률: {data.totalReturnRate.toFixed(2)}%
          </Badge>
          <Badge variant="outline" className="gap-1">
            실현 수익: {data.realizedProfit.toLocaleString()}원
          </Badge>
          <Badge variant="outline" className="gap-1">
            미실현 수익: {data.unrealizedProfit.toLocaleString()}원
          </Badge>
        </div>

        {/* 차트 타입 전환 */}
        <div className="flex gap-2 mb-4">
          <Badge 
            variant={chartType === 'cumulative' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setChartType('cumulative')}
          >
            누적 수익률
          </Badge>
          <Badge 
            variant={chartType === 'daily' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setChartType('daily')}
          >
            {period === 'daily' ? '일별' : period === 'weekly' ? '주별' : '월별'} 수익률
          </Badge>
        </div>

        {/* 차트 */}
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'cumulative' ? (
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorReturn" x1="0" y1="0" x2="0" y2="1">
                    <stop 
                      offset="5%" 
                      stopColor={COLORS.RISE} 
                      stopOpacity={0.3}
                    />
                    <stop 
                      offset="95%" 
                      stopColor={COLORS.RISE} 
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey={xKey}
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  domain={yDomain}
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip content={<CustomTooltip chartType={chartType} period={period} />} />
                <Area
                  type="monotone"
                  dataKey="cumulativeReturn"
                  stroke={COLORS.RISE}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorReturn)"
                />
              </AreaChart>
            ) : (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey={xKey}
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  domain={yDomain}
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip content={<CustomTooltip chartType={chartType} period={period} />} />
                <Line
                  type="monotone"
                  dataKey="returnRate"
                  stroke={COLORS.RISE}
                  strokeWidth={2}
                  dot={{ fill: COLORS.RISE, r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
