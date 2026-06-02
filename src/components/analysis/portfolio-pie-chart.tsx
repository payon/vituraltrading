'use client';

import { Pie, PieChart, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SectorData {
  sector: string;
  amount: number;
  percentage: number;
  color: string;
}

interface PortfolioPieChartProps {
  data: SectorData[];
}

// 커스텀 레전드 - 컴포넌트 외부로 이동
function CustomLegend({ payload }: any) {
  return (
    <ScrollArea className="h-[120px] w-full">
      <div className="flex flex-wrap gap-2 justify-center">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-1.5 text-sm">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.value}</span>
            <span className="font-medium">
              {entry.payload.percentage.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

// 커스텀 툴팁 - 컴포넌트 외부로 이동
function CustomTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white dark:bg-gray-800 border rounded-lg shadow-lg p-3">
        <p className="font-medium">{data.name}</p>
        <p className="text-sm text-muted-foreground">
          금액: {data.value.toLocaleString()}원
        </p>
        <p className="text-sm text-muted-foreground">
          비중: {data.percentage.toFixed(2)}%
        </p>
      </div>
    );
  }
  return null;
}

// 라벨 렌더링 함수
function renderCustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) {
  if (percent < 0.05) return null; // 5% 미만은 라벨 표시 안함
  
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text 
      x={x} 
      y={y} 
      fill="white" 
      textAnchor="middle" 
      dominantBaseline="central"
      className="text-xs font-medium"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

export function PortfolioPieChart({ data }: PortfolioPieChartProps) {
  // 데이터가 없는 경우
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">섹터별 분산도</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            보유 종목이 없습니다
          </div>
        </CardContent>
      </Card>
    );
  }

  // 파이 차트용 데이터 변환
  const chartData = data.map(item => ({
    name: item.sector,
    value: item.amount,
    percentage: item.percentage,
    fill: item.color,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">섹터별 분산도</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="45%"
                innerRadius={50}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
                labelLine={false}
                label={renderCustomLabel}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
