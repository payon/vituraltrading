'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Stock, formatPrice, formatRate, getPriceColor, calculateFee, COLORS, PriceType, AssetType, Account } from '@/lib/trading';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface OrderFormProps {
  stock: Stock | null;
  onOrderComplete?: () => void;
}

export function OrderForm({ stock, onOrderComplete }: OrderFormProps) {
  const [orderType, setOrderType] = useState<'BUY' | 'SELL'>('BUY');
  const [priceType, setPriceType] = useState<PriceType>('MARKET');
  const [price, setPrice] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [account, setAccount] = useState<Account | null>(null);
  const [accountLoading, setAccountLoading] = useState(true);
  const [holdings, setHoldings] = useState<{ symbol: string; quantity: number }[]>([]);

  // 계좌 정보 로드
  const fetchAccount = useCallback(async () => {
    try {
      const response = await fetch('/api/trading/account');
      const result = await response.json();
      if (result.success) {
        setAccount(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch account:', error);
    } finally {
      setAccountLoading(false);
    }
  }, []);

  // 보유 종목 로드
  const fetchHoldings = useCallback(async () => {
    try {
      const response = await fetch('/api/trading/portfolio');
      const result = await response.json();
      if (result.success && result.data.holdings) {
        setHoldings(result.data.holdings.map((h: { symbol: string; quantity: number }) => ({
          symbol: h.symbol,
          quantity: h.quantity
        })));
      }
    } catch (error) {
      console.error('Failed to fetch holdings:', error);
    }
  }, []);

  useEffect(() => {
    fetchAccount();
    fetchHoldings();
  }, [fetchAccount, fetchHoldings]);

  useEffect(() => {
    if (stock) {
      setPrice(stock.currentPrice);
      setQuantity(0);
    }
  }, [stock]);

  // 주문 완료 후 계좌 정보 갱신
  const refreshAccount = useCallback(() => {
    fetchAccount();
    fetchHoldings();
  }, [fetchAccount, fetchHoldings]);

  if (accountLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-[400px] text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          계좌 정보를 불러오는 중...
        </CardContent>
      </Card>
    );
  }

  if (!stock) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-[400px] text-muted-foreground">
          종목을 선택해주세요
        </CardContent>
      </Card>
    );
  }

  if (!account) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-[400px] text-muted-foreground">
          계좌 정보를 불러올 수 없습니다
        </CardContent>
      </Card>
    );
  }

  const currentPrice = stock.currentPrice;
  const executionPrice = priceType === 'MARKET' ? currentPrice : price;
  const orderAmount = executionPrice * quantity;
  const fee = calculateFee(orderAmount, stock.type as AssetType);
  const totalCost = orderType === 'BUY' ? orderAmount + fee : orderAmount - fee;

  // 보유 수량 확인
  const holding = holdings.find(h => h.symbol === stock.symbol);
  const holdingQuantity = holding?.quantity || 0;

  const maxQuantity = orderType === 'BUY' 
    ? Math.floor(account.balance / (executionPrice * (1 + (stock.type === 'COIN' ? 0.0005 : 0.00015))))
    : holdingQuantity;

  const handleQuantityPercent = (percent: number) => {
    const maxQty = orderType === 'BUY' 
      ? Math.floor(account.balance / (executionPrice * (1 + (stock.type === 'COIN' ? 0.0005 : 0.00015))))
      : holdingQuantity;
    setQuantity(Math.floor(maxQty * percent / 100));
  };

  const handleSubmit = () => {
    if (quantity <= 0) {
      toast.error('수량을 입력해주세요');
      return;
    }
    if (priceType === 'LIMIT' && price <= 0) {
      toast.error('지정가를 입력해주세요');
      return;
    }
    if (orderType === 'BUY' && totalCost > account.balance) {
      toast.error('잔고가 부족합니다');
      return;
    }
    if (orderType === 'SELL' && quantity > holdingQuantity) {
      toast.error('보유 수량보다 많은 수량을 매도할 수 없습니다');
      return;
    }
    setShowConfirm(true);
  };

  const confirmOrder = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/trading/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: stock.symbol,
          name: stock.name,
          type: stock.type,
          orderType,
          priceType,
          price: priceType === 'LIMIT' ? price : executionPrice,
          quantity,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success(orderType === 'BUY' ? '매수 주문이 체결되었습니다' : '매도 주문이 체결되었습니다');
        setQuantity(0);
        setShowConfirm(false);
        refreshAccount();
        onOrderComplete?.();
      } else {
        toast.error(result.error || '주문 처리에 실패했습니다');
      }
    } catch (error) {
      toast.error('주문 처리에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">주문하기</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 종목 정보 */}
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-semibold">{stock.name}</div>
                <div className="text-sm text-muted-foreground">{stock.symbol}</div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold">{formatPrice(currentPrice, stock.type as AssetType)}원</div>
                <div 
                  className="text-sm font-medium"
                  style={{ color: getPriceColor(stock.changeRate) }}
                >
                  {formatRate(stock.changeRate)}
                </div>
              </div>
            </div>
          </div>

          {/* 매수/매도 탭 */}
          <Tabs value={orderType} onValueChange={(v) => setOrderType(v as 'BUY' | 'SELL')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger 
                value="BUY" 
                className="data-[state=active]:bg-red-500 data-[state=active]:text-white"
              >
                매수
              </TabsTrigger>
              <TabsTrigger 
                value="SELL"
                className="data-[state=active]:bg-blue-500 data-[state=active]:text-white"
              >
                매도
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* 주문 유형 */}
          <div className="space-y-2">
            <Label>주문 유형</Label>
            <RadioGroup 
              value={priceType} 
              onValueChange={(v) => setPriceType(v as PriceType)}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="MARKET" id="market" />
                <Label htmlFor="market" className="cursor-pointer">시장가</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="LIMIT" id="limit" />
                <Label htmlFor="limit" className="cursor-pointer">지정가</Label>
              </div>
            </RadioGroup>
          </div>

          {/* 지정가 입력 */}
          {priceType === 'LIMIT' && (
            <div className="space-y-2">
              <Label>지정가</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={price || ''}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  placeholder="가격 입력"
                  className="pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">원</span>
              </div>
            </div>
          )}

          {/* 수량 */}
          <div className="space-y-2">
            <Label>수량</Label>
            <Input
              type="number"
              value={quantity || ''}
              onChange={(e) => setQuantity(Number(e.target.value))}
              placeholder="수량 입력"
            />
            <div className="flex gap-2">
              {[10, 25, 50, 100].map((pct) => (
                <Button 
                  key={pct} 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 text-xs"
                  onClick={() => handleQuantityPercent(pct)}
                >
                  {pct}%
                </Button>
              ))}
            </div>
          </div>

          {/* 주문 금액 정보 */}
          <div className="space-y-2 p-3 bg-muted rounded-lg text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">주문 금액</span>
              <span>{formatPrice(orderAmount)}원</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">수수료</span>
              <span>{formatPrice(fee)}원</span>
            </div>
            <div className="flex justify-between font-semibold pt-2 border-t">
              <span>{orderType === 'BUY' ? '총 주문 금액' : '정산 금액'}</span>
              <span style={{ color: orderType === 'BUY' ? COLORS.RISE : COLORS.FALL }}>
                {formatPrice(Math.abs(totalCost))}원
              </span>
            </div>
          </div>

          {/* 주문 버튼 */}
          <Button 
            className="w-full h-12 text-lg font-semibold"
            style={{ 
              backgroundColor: orderType === 'BUY' ? COLORS.RISE : COLORS.FALL,
            }}
            onClick={handleSubmit}
          >
            {orderType === 'BUY' ? '매수' : '매도'}
          </Button>
        </CardContent>
      </Card>

      {/* 주문 확인 모달 */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>주문 확인</DialogTitle>
            <DialogDescription>
              다음 내용으로 주문하시겠습니까?
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 p-4 bg-muted rounded-lg">
            <div className="flex justify-between">
              <span className="text-muted-foreground">종목</span>
              <span className="font-semibold">{stock.name} ({stock.symbol})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">주문 유형</span>
              <span style={{ color: orderType === 'BUY' ? COLORS.RISE : COLORS.FALL }}>
                {orderType === 'BUY' ? '매수' : '매도'} ({priceType === 'MARKET' ? '시장가' : '지정가'})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">주문 가격</span>
              <span>{formatPrice(executionPrice)}원</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">주문 수량</span>
              <span>{quantity}개</span>
            </div>
            <div className="flex justify-between pt-2 border-t font-semibold">
              <span>총 주문 금액</span>
              <span>{formatPrice(Math.abs(totalCost))}원</span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)}>
              취소
            </Button>
            <Button 
              onClick={confirmOrder}
              disabled={loading}
              style={{ backgroundColor: orderType === 'BUY' ? COLORS.RISE : COLORS.FALL }}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
