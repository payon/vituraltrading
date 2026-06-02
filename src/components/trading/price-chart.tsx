'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Stock, ChartDataPoint, formatPrice, AssetType } from '@/lib/trading';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  Area,
  AreaChart,
  BarChart,
  Bar
} from 'recharts';

interface PriceChartProps {
  stock: Stock | null;
}

type ChartPeriod = '1d' | '1w' | '1m' | '3m' | '1y';

const PERIOD_LABELS: Record<ChartPeriod, string> = {
  '1d': '1일',
  '1w': '1주',
  '1m': '1월',
  '3m': '3월',
  '1y': '1년',
};

export function PriceChart({ stock }: PriceChartProps) {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [interval, setInterval] = useState('1d');
  const [period, setPeriod] = useState<ChartPeriod>('1m');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (stock) {
      fetchChartData();
    }
  }, [stock, interval, period]);

  const fetchChartData = async () => {
    if (!stock) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/trading/chart?symbol=${stock.symbol}&interval=${interval}&period=${period}`);
      const result = await response.json();
      if (result.success) {
        setChartData(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Determine time format based on interval and period
  const getTimeFormat = (timestamp: Date) => {
    const date = new Date(timestamp);
    
    // For longer periods, show month/day
    if (period === '1m' || period === '3m' || period === '1y') {
      return date.toLocaleDateString('ko-KR', { 
        month: 'short', 
        day: 'numeric',
      });
    }
    
    // For shorter periods, show time
    if (interval === '1m' || interval === '1h') {
      return date.toLocaleTimeString('ko-KR', { 
        hour: '2-digit', 
        minute: '2-digit',
      });
    }
    
    // For daily/weekly interval, show date
    return date.toLocaleDateString('ko-KR', { 
      month: 'short', 
      day: 'numeric',
    });
  };

  const formattedData = useMemo(() => {
    return chartData.map(d => ({
      ...d,
      time: getTimeFormat(d.timestamp),
      price: d.close,
    }));
  }, [chartData, interval, period]);

  const priceDomain = useMemo(() => {
    if (formattedData.length === 0) return [0, 100];
    const prices = formattedData.map(d => d.close);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const padding = (max - min) * 0.1;
    return [Math.max(0, min - padding), max + padding];
  }, [formattedData]);

  if (!stock) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-[350px] text-muted-foreground">
          종목을 선택해주세요
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {stock.name} ({stock.symbol})
            </CardTitle>
            {/* Interval selector */}
            <Tabs value={interval} onValueChange={setInterval}>
              <TabsList className="h-8">
                <TabsTrigger value="1m" className="text-xs px-2">분</TabsTrigger>
                <TabsTrigger value="1h" className="text-xs px-2">시</TabsTrigger>
                <TabsTrigger value="1d" className="text-xs px-2">일</TabsTrigger>
                <TabsTrigger value="1w" className="text-xs px-2">주</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          {/* Period selector */}
          <div className="flex items-center justify-end">
            <ToggleGroup 
              type="single" 
              value={period} 
              onValueChange={(value) => value && setPeriod(value as ChartPeriod)}
              variant="outline"
              size="sm"
              className="border rounded-md"
            >
              {(Object.keys(PERIOD_LABELS) as ChartPeriod[]).map((p) => (
                <ToggleGroupItem 
                  key={p} 
                  value={p} 
                  className="text-xs px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                >
                  {PERIOD_LABELS[p]}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">로딩 중...</div>
          </div>
        ) : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={formattedData}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="rgb(255, 82, 82)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="rgb(255, 82, 82)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="time" 
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  domain={priceDomain}
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => formatPrice(v, stock?.type as AssetType)}
                  width={70}
                  orientation="right"
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                    border: 'none', 
                    borderRadius: '8px',
                    color: 'white'
                  }}
                  formatter={(value: number) => [formatPrice(value, stock?.type as AssetType) + '원', '가격']}
                  labelFormatter={(label) => `시간: ${label}`}
                />
                <Area 
                  type="monotone" 
                  dataKey="price" 
                  stroke="rgb(255, 82, 82)" 
                  strokeWidth={2}
                  fill="url(#colorPrice)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
        
        {/* 거래량 차트 */}
        {formattedData.length > 0 && (
          <div className="h-[80px] mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={formattedData}>
                <XAxis dataKey="time" hide />
                <YAxis hide domain={['auto', 'auto']} />
                <Bar 
                  dataKey="volume" 
                  fill="rgba(128, 128, 128, 0.3)" 
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
