'use client';

import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Bitcoin, Wallet } from 'lucide-react';

interface AssetAllocationData {
  stock: { amount: number; percentage: number };
  coin: { amount: number; percentage: number };
  cash: { amount: number; percentage: number };
}

interface AssetAllocationProps {
  data: AssetAllocationData;
}

// 자산별 색상
const ASSET_COLORS = {
  stock: 'rgb(255, 82, 82)',    // 주식: 빨강
  coin: 'rgb(255, 193, 7)',     // 코인: 노랑
  cash: 'rgb(158, 158, 158)',   // 현금: 회색
};

// 커스텀 툴팁 - 컴포넌트 외부로 이동
function CustomTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    return (
      <div className="bg-white dark:bg-gray-800 border rounded-lg shadow-lg p-3">
        <p className="font-medium">{item.name}</p>
        <p className="text-sm text-muted-foreground">
          금액: {item.amount.toLocaleString()}원
        </p>
        <p className="text-sm text-muted-foreground">
          비중: {item.percentage.toFixed(2)}%
        </p>
      </div>
    );
  }
  return null;
}

export function AssetAllocation({ data }: AssetAllocationProps) {
  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">자산 배분 현황</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            자산 배분 데이터가 없습니다
          </div>
        </CardContent>
      </Card>
    );
  }

  // 바 차트 데이터
  const chartData = [
    { 
      name: '주식', 
      amount: data.stock.amount, 
      percentage: data.stock.percentage,
      fill: ASSET_COLORS.stock 
    },
    { 
      name: '코인', 
      amount: data.coin.amount, 
      percentage: data.coin.percentage,
      fill: ASSET_COLORS.coin 
    },
    { 
      name: '현금', 
      amount: data.cash.amount, 
      percentage: data.cash.percentage,
      fill: ASSET_COLORS.cash 
    },
  ];

  // 총 자산
  const totalAssets = data.stock.amount + data.coin.amount + data.cash.amount;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">자산 배분 현황</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 요약 카드 */}
        <div className="grid grid-cols-3 gap-3">
          {/* 주식 */}
          <div className="p-3 rounded-lg border" style={{ borderColor: ASSET_COLORS.stock }}>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4" style={{ color: ASSET_COLORS.stock }} />
              <span className="text-sm font-medium">주식</span>
            </div>
            <p className="text-lg font-bold" style={{ color: ASSET_COLORS.stock }}>
              {data.stock.percentage.toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground">
              {data.stock.amount.toLocaleString()}원
            </p>
          </div>

          {/* 코인 */}
          <div className="p-3 rounded-lg border" style={{ borderColor: ASSET_COLORS.coin }}>
            <div className="flex items-center gap-2 mb-2">
              <Bitcoin className="w-4 h-4" style={{ color: ASSET_COLORS.coin }} />
              <span className="text-sm font-medium">코인</span>
            </div>
            <p className="text-lg font-bold" style={{ color: ASSET_COLORS.coin }}>
              {data.coin.percentage.toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground">
              {data.coin.amount.toLocaleString()}원
            </p>
          </div>

          {/* 현금 */}
          <div className="p-3 rounded-lg border" style={{ borderColor: ASSET_COLORS.cash }}>
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-4 h-4" style={{ color: ASSET_COLORS.cash }} />
              <span className="text-sm font-medium">현금</span>
            </div>
            <p className="text-lg font-bold" style={{ color: ASSET_COLORS.cash }}>
              {data.cash.percentage.toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground">
              {data.cash.amount.toLocaleString()}원
            </p>
          </div>
        </div>

        {/* 프로그레스 바 */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>자산 배분 비율</span>
            <span className="text-muted-foreground">
              총 {totalAssets.toLocaleString()}원
            </span>
          </div>
          <div className="h-4 rounded-full overflow-hidden flex bg-muted">
            {data.stock.percentage > 0 && (
              <div 
                className="h-full transition-all duration-500"
                style={{ 
                  width: `${data.stock.percentage}%`,
                  backgroundColor: ASSET_COLORS.stock 
                }}
              />
            )}
            {data.coin.percentage > 0 && (
              <div 
                className="h-full transition-all duration-500"
                style={{ 
                  width: `${data.coin.percentage}%`,
                  backgroundColor: ASSET_COLORS.coin 
                }}
              />
            )}
            {data.cash.percentage > 0 && (
              <div 
                className="h-full transition-all duration-500"
                style={{ 
                  width: `${data.cash.percentage}%`,
                  backgroundColor: ASSET_COLORS.cash 
                }}
              />
            )}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span style={{ color: ASSET_COLORS.stock }}>주식 {data.stock.percentage.toFixed(1)}%</span>
            <span style={{ color: ASSET_COLORS.coin }}>코인 {data.coin.percentage.toFixed(1)}%</span>
            <span style={{ color: ASSET_COLORS.cash }}>현금 {data.cash.percentage.toFixed(1)}%</span>
          </div>
        </div>

        {/* 바 차트 */}
        <div className="h-[150px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={chartData} 
              layout="vertical"
              margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis 
                type="number"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
              />
              <YAxis 
                type="category"
                dataKey="name"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                width={40}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="amount" 
                radius={[0, 4, 4, 0]}
                maxBarSize={30}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 분산 투자 상태 */}
        <div className="flex flex-wrap gap-2">
          {data.stock.percentage > 70 && (
            <Badge variant="outline" className="text-amber-600 border-amber-500">
              주식 비중 높음
            </Badge>
          )}
          {data.coin.percentage > 50 && (
            <Badge variant="outline" className="text-amber-600 border-amber-500">
              코인 비중 높음
            </Badge>
          )}
          {data.cash.percentage > 50 && (
            <Badge variant="outline" className="text-blue-600 border-blue-500">
              현금 비중 높음
            </Badge>
          )}
          {data.stock.percentage > 0 && data.coin.percentage > 0 && data.cash.percentage > 10 && (
            <Badge variant="outline" className="text-green-600 border-green-500">
              분산 투자 잘됨
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
