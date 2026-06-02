'use client';

/**
 * 예약 주문 컴포넌트
 * - 지정가 주문 생성
 * - 예약 주문 목록 표시
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Clock, 
  Plus, 
  Trash2, 
  TrendingUp, 
  TrendingDown,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Stock, AssetType } from '@/lib/trading';

interface PendingOrder {
  id: string;
  symbol: string;
  name: string;
  assetType: string;
  orderType: 'BUY' | 'SELL';
  price: number;
  quantity: number;
  totalAmount: number;
  status: string;
  createdAt: string;
  expiresAt: string | null;
}

interface PendingOrdersProps {
  stock: Stock | null;
  assetType: AssetType;
  onOrderCreated?: () => void;
}

export function PendingOrders({ stock, assetType, onOrderCreated }: PendingOrdersProps) {
  const { toast } = useToast();
  const [orders, setOrders] = useState<PendingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // 폼 상태
  const [orderType, setOrderType] = useState<'BUY' | 'SELL'>('BUY');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('1');

  // 예약 주문 목록 로드
  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/trading/pending-orders');
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  // 예약 주문 생성
  const handleCreateOrder = async () => {
    if (!stock) {
      toast({
        title: '오류',
        description: '종목을 선택해주세요.',
        variant: 'destructive',
      });
      return;
    }

    const targetPrice = parseFloat(price);
    const qty = parseFloat(quantity);

    if (!targetPrice || !qty) {
      toast({
        title: '오류',
        description: '가격과 수량을 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch('/api/trading/pending-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: stock.symbol,
          name: stock.name,
          assetType,
          orderType,
          price: targetPrice,
          quantity: qty,
        }),
      });

      if (!response.ok) throw new Error('Failed to create order');

      toast({
        title: '예약 주문 생성',
        description: `${stock.name} ${orderType === 'BUY' ? '매수' : '매도'} 예약 주문이 등록되었습니다.`,
      });

      setDialogOpen(false);
      setPrice('');
      setQuantity('1');
      fetchOrders();
      onOrderCreated?.();
    } catch (error) {
      console.error('Failed to create order:', error);
      toast({
        title: '오류',
        description: '예약 주문 생성에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  // 예약 주문 취소
  const handleCancelOrder = async (id: string) => {
    try {
      const response = await fetch(`/api/trading/pending-orders?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to cancel order');

      toast({
        title: '주문 취소',
        description: '예약 주문이 취소되었습니다.',
      });

      fetchOrders();
    } catch (error) {
      console.error('Failed to cancel order:', error);
      toast({
        title: '오류',
        description: '주문 취소에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  // 금액 포맷팅
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('ko-KR') + '원';
  };

  // 안전한 가격 포맷팅
  const formatPrice = (price: number | undefined): string => {
    if (price === undefined || price === null || isNaN(price)) return '-';
    return price.toLocaleString('ko-KR');
  };

  // 안전한 퍼센트 포맷팅
  const formatPercent = (percent: number | undefined): string => {
    if (percent === undefined || percent === null || isNaN(percent)) return '-';
    return percent.toFixed(2);
  };

  // 날짜 포맷팅
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 현재 가격 설정
  useEffect(() => {
    if (stock && dialogOpen) {
      setPrice(stock.price.toString());
    }
  }, [stock, dialogOpen]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="w-4 h-4" />
              예약 주문
            </CardTitle>
            <CardDescription className="text-xs">
              목표가 도달 시 자동 체결
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" disabled={!stock}>
                <Plus className="w-4 h-4 mr-1" />
                예약
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>예약 주문</DialogTitle>
                <DialogDescription>
                  목표 가격에 도달하면 자동으로 주문이 체결됩니다.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 pt-4">
                {/* 종목 정보 */}
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    assetType === 'COIN' ? 'bg-amber-500/20' : 'bg-red-500/20'
                  }`}>
                    {assetType === 'COIN' ? (
                      <TrendingUp className="w-5 h-5 text-amber-500" />
                    ) : (
                      <TrendingUp className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{stock?.name}</p>
                    <p className="text-sm text-muted-foreground">{stock?.symbol}</p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="font-medium">{formatPrice(stock?.price)}원</p>
                    <p className={`text-sm ${stock?.changePercent && stock.changePercent >= 0 ? 'text-red-500' : 'text-blue-500'}`}>
                      {stock?.changePercent && stock.changePercent >= 0 ? '+' : ''}{formatPercent(stock?.changePercent)}%
                    </p>
                  </div>
                </div>

                {/* 주문 유형 */}
                <div className="space-y-2">
                  <Label>주문 유형</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant={orderType === 'BUY' ? 'default' : 'outline'}
                      className={orderType === 'BUY' ? 'bg-red-500 hover:bg-red-600' : ''}
                      onClick={() => setOrderType('BUY')}
                    >
                      <TrendingUp className="w-4 h-4 mr-2" />
                      매수
                    </Button>
                    <Button
                      type="button"
                      variant={orderType === 'SELL' ? 'default' : 'outline'}
                      className={orderType === 'SELL' ? 'bg-blue-500 hover:bg-blue-600' : ''}
                      onClick={() => setOrderType('SELL')}
                    >
                      <TrendingDown className="w-4 h-4 mr-2" />
                      매도
                    </Button>
                  </div>
                </div>

                {/* 목표 가격 */}
                <div className="space-y-2">
                  <Label htmlFor="target-price">목표 가격</Label>
                  <Input
                    id="target-price"
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="목표 가격 입력"
                  />
                  <p className="text-xs text-muted-foreground">
                    현재가 대비 {stock && price && ((parseFloat(price) - stock.price) / stock.price * 100).toFixed(2)}%
                  </p>
                </div>

                {/* 수량 */}
                <div className="space-y-2">
                  <Label htmlFor="quantity">수량</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="수량 입력"
                  />
                </div>

                {/* 예상 금액 */}
                {price && quantity && (
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex justify-between text-sm">
                      <span>예상 금액</span>
                      <span className="font-medium">
                        {formatCurrency(parseFloat(price) * parseFloat(quantity))}
                      </span>
                    </div>
                  </div>
                )}

                <Button className="w-full" onClick={handleCreateOrder}>
                  예약 주문 등록
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4 text-muted-foreground">
            로딩 중...
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">예약 주문이 없습니다</p>
          </div>
        ) : (
          <ScrollArea className="h-[200px]">
            <div className="space-y-2">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-2 rounded-lg border"
                >
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={order.orderType === 'BUY' ? 'default' : 'secondary'}
                      className={order.orderType === 'BUY' ? 'bg-red-500' : 'bg-blue-500'}
                    >
                      {order.orderType === 'BUY' ? '매수' : '매도'}
                    </Badge>
                    <div>
                      <p className="font-medium text-sm">{order.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {order.price.toLocaleString()}원 × {order.quantity}주
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        {formatDate(order.createdAt)}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        대기중
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleCancelOrder(order.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
