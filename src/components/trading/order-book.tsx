'use client';

/**
 * HTS/MTS 스타일 호가창 컴포넌트
 * - 매수/매도 호가 표시
 * - 실시간 체결 강도 표시
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { Stock } from '@/lib/trading';

interface OrderBookProps {
  stock: Stock | null;
}

interface OrderLevel {
  price: number;
  quantity: number;
  ratio: number;
}

interface OrderBookData {
  askLevels: OrderLevel[];
  bidLevels: OrderLevel[];
  tradePrice: number;
  tradeQuantity: number;
  tradeType: 'BUY' | 'SELL' | 'NONE';
  accumulatedAsk: number;
  accumulatedBid: number;
}

// 목업 호가 데이터 생성
function generateOrderBookData(currentPrice: number): OrderBookData {
  const unit = currentPrice >= 100000 ? 1000 : currentPrice >= 10000 ? 100 : currentPrice >= 1000 ? 10 : 1;
  
  const askLevels: OrderLevel[] = [];
  for (let i = 4; i >= 0; i--) {
    const price = currentPrice + unit * (i + 1);
    const quantity = Math.floor(Math.random() * 10000) + 100;
    askLevels.push({ price, quantity, ratio: 0 });
  }

  const bidLevels: OrderLevel[] = [];
  for (let i = 0; i < 5; i++) {
    const price = currentPrice - unit * (i + 1);
    if (price > 0) {
      const quantity = Math.floor(Math.random() * 10000) + 100;
      bidLevels.push({ price, quantity, ratio: 0 });
    }
  }

  const maxAsk = Math.max(...askLevels.map(l => l.quantity));
  const maxBid = bidLevels.length > 0 ? Math.max(...bidLevels.map(l => l.quantity)) : 1;
  const maxQty = Math.max(maxAsk, maxBid);

  askLevels.forEach(level => {
    level.ratio = (level.quantity / maxQty) * 100;
  });
  bidLevels.forEach(level => {
    level.ratio = (level.quantity / maxQty) * 100;
  });

  const tradeType = Math.random() > 0.5 ? 'BUY' : 'SELL';
  const accumulatedAsk = askLevels.reduce((sum, l) => sum + l.quantity, 0);
  const accumulatedBid = bidLevels.reduce((sum, l) => sum + l.quantity, 0);

  return {
    askLevels,
    bidLevels,
    tradePrice: currentPrice + (Math.random() > 0.5 ? unit : -unit) * Math.floor(Math.random() * 3),
    tradeQuantity: Math.floor(Math.random() * 1000) + 10,
    tradeType,
    accumulatedAsk,
    accumulatedBid,
  };
}

function formatPrice(price: number): string {
  return price.toLocaleString('ko-KR');
}

function formatQuantity(qty: number): string {
  if (qty >= 1000000) {
    return (qty / 1000000).toFixed(1) + 'M';
  }
  if (qty >= 1000) {
    return (qty / 1000).toFixed(1) + 'K';
  }
  return qty.toString();
}

export function OrderBook({ stock }: OrderBookProps) {
  const [tick, setTick] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // 주기적으로 tick 업데이트
  useEffect(() => {
    if (!stock) return;

    intervalRef.current = setInterval(() => {
      setTick(t => t + 1);
    }, 3000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [stock]);

  // tick과 stock에 따라 호가 데이터 계산
  const orderBook = useMemo(() => {
    if (!stock) return null;
    return generateOrderBookData(stock.price);
  }, [stock, tick]);

  // 체결 강도 계산
  const tradeStrength = useMemo(() => {
    if (!orderBook) return 50;
    const total = orderBook.accumulatedAsk + orderBook.accumulatedBid;
    if (total === 0) return 50;
    return Math.round((orderBook.accumulatedBid / total) * 100);
  }, [orderBook]);

  if (!stock || !orderBook) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="w-4 h-4" />
            호가창
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground py-8">
          종목을 선택하세요
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="w-4 h-4" />
            호가창
          </CardTitle>
          <Badge variant={tradeStrength >= 50 ? 'default' : 'secondary'} className="text-xs">
            체결강도 {tradeStrength}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        {/* 체결 강도 바 */}
        <div className="mb-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <TrendingUp className="w-3 h-3 text-red-500" />
            <span>매수 {formatQuantity(orderBook.accumulatedBid)}</span>
            <div className="flex-1" />
            <span>매도 {formatQuantity(orderBook.accumulatedAsk)}</span>
            <TrendingDown className="w-3 h-3 text-blue-500" />
          </div>
          <div className="relative h-2 bg-blue-200 dark:bg-blue-900 rounded overflow-hidden">
            <div 
              className="absolute left-0 top-0 h-full bg-red-500 transition-all duration-300"
              style={{ width: `${tradeStrength}%` }}
            />
          </div>
        </div>

        {/* 테이블 헤더 */}
        <div className="grid grid-cols-3 text-xs text-muted-foreground border-b pb-1">
          <span className="text-right">매도수량</span>
          <span className="text-center">가격</span>
          <span>매수수량</span>
        </div>

        {/* 매도 호가 */}
        {orderBook.askLevels.map((level, index) => (
          <div key={`ask-${index}`} className="grid grid-cols-3 text-sm py-0.5 relative">
            <div className="text-right relative">
              <div 
                className="absolute inset-y-0 right-0 bg-blue-100 dark:bg-blue-900/30"
                style={{ width: `${level.ratio}%` }}
              />
              <span className="relative z-10 text-blue-600 dark:text-blue-400">
                {formatQuantity(level.quantity)}
              </span>
            </div>
            <div className="text-center relative">
              <div className="absolute inset-0 bg-blue-500/10" />
              <span className="relative z-10 text-blue-600 dark:text-blue-400 font-medium">
                {formatPrice(level.price)}
              </span>
            </div>
            <div />
          </div>
        ))}

        {/* 현재가 구분선 */}
        <div className="border-y border-dashed py-1 my-1">
          <div className="grid grid-cols-3 text-sm">
            <div className="text-right text-muted-foreground">-</div>
            <div className={`text-center font-bold ${
              stock.changePercent >= 0 ? 'text-red-500' : 'text-blue-500'
            }`}>
              {formatPrice(stock.price)}
            </div>
            <div className="text-muted-foreground">-</div>
          </div>
        </div>

        {/* 매수 호가 */}
        {orderBook.bidLevels.map((level, index) => (
          <div key={`bid-${index}`} className="grid grid-cols-3 text-sm py-0.5 relative">
            <div />
            <div className="text-center relative">
              <div className="absolute inset-0 bg-red-500/10" />
              <span className="relative z-10 text-red-600 dark:text-red-400 font-medium">
                {formatPrice(level.price)}
              </span>
            </div>
            <div className="relative">
              <div 
                className="absolute inset-y-0 left-0 bg-red-100 dark:bg-red-900/30"
                style={{ width: `${level.ratio}%` }}
              />
              <span className="relative z-10 text-red-600 dark:text-red-400">
                {formatQuantity(level.quantity)}
              </span>
            </div>
          </div>
        ))}

        {/* 최근 체결 정보 */}
        <div className="mt-3 pt-2 border-t">
          <div className="text-xs text-muted-foreground mb-1">최근 체결</div>
          <div className="flex items-center gap-2">
            <Badge 
              variant={orderBook.tradeType === 'BUY' ? 'default' : 'secondary'}
              className={orderBook.tradeType === 'BUY' ? 'bg-red-500' : 'bg-blue-500'}
            >
              {orderBook.tradeType === 'BUY' ? '매수' : '매도'}
            </Badge>
            <span className="font-medium">{formatPrice(orderBook.tradePrice)}</span>
            <span className="text-muted-foreground text-sm">
              {formatQuantity(orderBook.tradeQuantity)}주
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
