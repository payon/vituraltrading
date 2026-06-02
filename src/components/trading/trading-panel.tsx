'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Stock, formatPrice, formatRate, getPriceColor, COLORS } from '@/lib/trading';
import { OrderForm } from './order-form';

interface TradingPanelProps {
  stock: Stock | null;
  onOrderComplete?: () => void;
}

export function TradingPanel({ stock, onOrderComplete }: TradingPanelProps) {
  const [orderType, setOrderType] = useState<'BUY' | 'SELL'>('BUY');

  if (!stock) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-[400px] text-muted-foreground">
          종목을 선택해주세요
        </CardContent>
      </Card>
    );
  }

  // 모의 호가 데이터 생성
  const generateOrderBook = (price: number) => {
    const askOrders = [];
    const bidOrders = [];
    
    for (let i = 5; i >= 1; i--) {
      const askPrice = price + (i * price * 0.001);
      const askQty = Math.floor(Math.random() * 1000) + 100;
      askOrders.push({ price: Math.floor(askPrice), quantity: askQty, total: askQty });
    }
    
    for (let i = 1; i <= 5; i++) {
      const bidPrice = price - (i * price * 0.001);
      const bidQty = Math.floor(Math.random() * 1000) + 100;
      bidOrders.push({ price: Math.floor(bidPrice), quantity: bidQty, total: bidQty });
    }
    
    return { askOrders, bidOrders };
  };

  const { askOrders, bidOrders } = generateOrderBook(stock.currentPrice);
  const maxQty = Math.max(
    ...askOrders.map(o => o.quantity),
    ...bidOrders.map(o => o.quantity)
  );

  return (
    <div className="space-y-4">
      {/* 호가창 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">호가</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {/* 매도 호가 (왼쪽) */}
            <div className="space-y-1">
              <div className="text-xs text-center font-medium text-muted-foreground mb-2">매도</div>
              {askOrders.map((order, idx) => {
                const width = (order.quantity / maxQty) * 100;
                return (
                  <div key={idx} className="relative">
                    <div 
                      className="absolute inset-y-0 left-0 opacity-20"
                      style={{ 
                        width: `${width}%`, 
                        backgroundColor: COLORS.RISE 
                      }}
                    />
                    <div className="relative flex justify-between text-sm px-2 py-1">
                      <span style={{ color: COLORS.RISE }}>{formatPrice(order.price)}</span>
                      <span>{order.quantity.toLocaleString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* 매수 호가 (오른쪽) */}
            <div className="space-y-1">
              <div className="text-xs text-center font-medium text-muted-foreground mb-2">매수</div>
              {bidOrders.map((order, idx) => {
                const width = (order.quantity / maxQty) * 100;
                return (
                  <div key={idx} className="relative">
                    <div 
                      className="absolute inset-y-0 right-0 opacity-20"
                      style={{ 
                        width: `${width}%`, 
                        backgroundColor: COLORS.FALL 
                      }}
                    />
                    <div className="relative flex justify-between text-sm px-2 py-1">
                      <span>{order.quantity.toLocaleString()}</span>
                      <span style={{ color: COLORS.FALL }}>{formatPrice(order.price)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 주문 폼 */}
      <OrderForm stock={stock} onOrderComplete={onOrderComplete} />
    </div>
  );
}
