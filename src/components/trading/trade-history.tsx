'use client';

import { useEffect, useState, useRef, useSyncExternalStore } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { COLORS } from '@/lib/trading';
import { Activity, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

// Client-only rendering helper
const emptySubscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

function useIsClient() {
  return useSyncExternalStore(emptySubscribe, getSnapshot, getServerSnapshot);
}

interface Trade {
  id: string;
  symbol: string;
  name: string;
  price: number;
  quantity: number;
  tradeType: 'BUY' | 'SELL';
  tradedAt: string;
}

// Pre-generated deterministic mock trades for SSR consistency
const getInitialTrades = (): Trade[] => {
  const stocks = [
    { symbol: '005930', name: '삼성전자' },
    { symbol: '000660', name: 'SK하이닉스' },
    { symbol: '373220', name: 'LG에너지솔루션' },
    { symbol: '207940', name: '삼성바이오로직스' },
    { symbol: '005380', name: '현대차' },
    { symbol: '035420', name: 'NAVER' },
    { symbol: '068270', name: '셀트리온' },
    { symbol: '051910', name: 'LG화학' },
    { symbol: '006400', name: '삼성SDI' },
    { symbol: '035720', name: '카카오' },
  ];

  // Use fixed seed for deterministic results
  const baseTime = new Date(2026, 0, 15, 14, 30, 0).getTime();
  const trades: Trade[] = [];
  
  for (let i = 0; i < 30; i++) {
    // Deterministic values based on index
    const stockIndex = i % stocks.length;
    const minutesAgo = i % 5;
    const secondsAgo = (i * 2) % 60;
    const tradedAt = new Date(baseTime - minutesAgo * 60000 - secondsAgo * 1000);
    
    // Deterministic prices
    const basePrice = 50000 + (i * 15000) % 450000;
    const priceVariation = (i * 100) % 1000;

    trades.push({
      id: `trade-${i}`,
      symbol: stocks[stockIndex].symbol,
      name: stocks[stockIndex].name,
      price: basePrice + priceVariation,
      quantity: ((i * 7) % 100) + 1,
      tradeType: i % 2 === 0 ? 'BUY' : 'SELL',
      tradedAt: tradedAt.toISOString(),
    });
  }

  return trades.sort((a, b) => new Date(b.tradedAt).getTime() - new Date(a.tradedAt).getTime());
};

// Format price with Korean locale
const formatPriceKorean = (price: number): string => {
  return price.toLocaleString('ko-KR', {
    style: 'decimal',
    maximumFractionDigits: 0,
  });
};

// Format time
const formatTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
};

// Format date
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

interface TradeItemProps {
  trade: Trade;
  isNew?: boolean;
}

function TradeItem({ trade, isNew }: TradeItemProps) {
  const isBuy = trade.tradeType === 'BUY';

  return (
    <div
      className={cn(
        'flex items-center gap-3 py-3 px-4 border-b border-border/50 transition-all duration-500',
        isNew && 'animate-trade-in bg-accent/30'
      )}
    >
      {/* Trade Type Indicator */}
      <div
        className={cn(
          'flex items-center justify-center w-10 h-10 rounded-full shrink-0',
          isBuy ? 'bg-red-500/10' : 'bg-blue-500/10'
        )}
      >
        {isBuy ? (
          <TrendingUp className="w-5 h-5" style={{ color: COLORS.RISE }} />
        ) : (
          <TrendingDown className="w-5 h-5" style={{ color: COLORS.FALL }} />
        )}
      </div>

      {/* Stock Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold truncate">{trade.name}</span>
          <Badge
            variant="outline"
            className={cn(
              'shrink-0 text-xs',
              isBuy ? 'border-red-500/50 text-red-500' : 'border-blue-500/50 text-blue-500'
            )}
          >
            {isBuy ? '매수' : '매도'}
          </Badge>
        </div>
        <div className="text-xs text-muted-foreground">{trade.symbol}</div>
      </div>

      {/* Price & Quantity */}
      <div className="text-right shrink-0">
        <div
          className="font-bold tabular-nums"
          style={{ color: isBuy ? COLORS.RISE : COLORS.FALL }}
        >
          {formatPriceKorean(trade.price)}원
        </div>
        <div className="text-xs text-muted-foreground">
          {trade.quantity.toLocaleString('ko-KR')}주
        </div>
      </div>

      {/* Time */}
      <div className="text-right shrink-0 w-16">
        <div className="text-xs text-muted-foreground flex items-center justify-end gap-1">
          <Clock className="w-3 h-3" />
          {formatTime(trade.tradedAt)}
        </div>
      </div>
    </div>
  );
}

export function TradeHistory() {
  // Initialize with deterministic trades for SSR consistency
  const [trades, setTrades] = useState<Trade[]>(getInitialTrades);
  const [newTradeIds, setNewTradeIds] = useState<Set<string>>(new Set());
  const isClient = useIsClient();
  const scrollRef = useRef<HTMLDivElement>(null);
  const tradeCounterRef = useRef(100);

  // Simulate new trades coming in (only on client)
  useEffect(() => {
    if (!isClient) return;
    
    const stocks = [
      { symbol: '005930', name: '삼성전자' },
      { symbol: '000660', name: 'SK하이닉스' },
      { symbol: '373220', name: 'LG에너지솔루션' },
      { symbol: '207940', name: '삼성바이오로직스' },
      { symbol: '005380', name: '현대차' },
      { symbol: '035420', name: 'NAVER' },
    ];

    const interval = setInterval(() => {
      const stockIndex = tradeCounterRef.current % stocks.length;
      const stock = stocks[stockIndex];
      const now = new Date(2026, 0, 15, 14, 30, 0);

      const newTrade: Trade = {
        id: `trade-new-${tradeCounterRef.current++}`,
        symbol: stock.symbol,
        name: stock.name,
        price: 50000 + (tradeCounterRef.current * 7500) % 450000,
        quantity: ((tradeCounterRef.current * 13) % 100) + 1,
        tradeType: tradeCounterRef.current % 2 === 0 ? 'BUY' : 'SELL',
        tradedAt: now.toISOString(),
      };

      setTrades((prev) => [newTrade, ...prev].slice(0, 100));
      setNewTradeIds((prev) => new Set([...prev, newTrade.id]));

      setTimeout(() => {
        setNewTradeIds((prev) => {
          const next = new Set(prev);
          next.delete(newTrade.id);
          return next;
        });
      }, 2000);
    }, 3000);

    return () => clearInterval(interval);
  }, [isClient]);

  // Auto-scroll to top when new trade arrives
  useEffect(() => {
    if (scrollRef.current && newTradeIds.size > 0) {
      scrollRef.current.scrollTop = 0;
    }
  }, [newTradeIds]);

  // Get unique dates for grouping
  const groupedTrades = trades.reduce<{ date: string; trades: Trade[] }[]>((acc, trade) => {
    const date = formatDate(trade.tradedAt);
    const existingGroup = acc.find((g) => g.date === date);
    if (existingGroup) {
      existingGroup.trades.push(trade);
    } else {
      acc.push({ date, trades: [trade] });
    }
    return acc;
  }, []);

  // Stats
  const buyCount = trades.filter((t) => t.tradeType === 'BUY').length;
  const sellCount = trades.filter((t) => t.tradeType === 'SELL').length;
  const totalVolume = trades.reduce((sum, t) => sum + t.price * t.quantity, 0);

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            실시간 체결 내역
          </CardTitle>
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
            </span>
            <span className="text-xs text-muted-foreground">LIVE</span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-4 text-xs pt-2">
          <div className="flex items-center gap-1">
            <Badge
              variant="outline"
              className="bg-red-500/10 text-red-500 border-red-500/30"
            >
              매수 {buyCount}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            <Badge
              variant="outline"
              className="bg-blue-500/10 text-blue-500 border-blue-500/30"
            >
              매도 {sellCount}
            </Badge>
          </div>
          <div className="text-muted-foreground">
            거래대금: {formatPriceKorean(totalVolume)}원
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-[400px]" ref={scrollRef}>
          {groupedTrades.map((group) => (
            <div key={group.date}>
              {/* Date Header */}
              <div className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm px-4 py-2 text-xs font-medium text-muted-foreground border-b border-border/50">
                {group.date}
              </div>

              {/* Trades */}
              <div className="divide-y divide-border/30">
                {group.trades.map((trade) => (
                  <TradeItem
                    key={trade.id}
                    trade={trade}
                    isNew={newTradeIds.has(trade.id)}
                  />
                ))}
              </div>
            </div>
          ))}

          {trades.length === 0 && (
            <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
              <Activity className="w-8 h-8 mb-2 opacity-50" />
              <p>체결 내역이 없습니다</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default TradeHistory;
