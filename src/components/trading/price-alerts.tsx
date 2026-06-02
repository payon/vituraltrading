'use client';

/**
 * 가격 알림 컴포넌트
 * - 목표가 도달 시 알림
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
  Bell, 
  BellOff, 
  Plus, 
  Trash2, 
  TrendingUp, 
  TrendingDown,
  CheckCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Stock, AssetType } from '@/lib/trading';

interface PriceAlertItem {
  id: string;
  symbol: string;
  name: string;
  assetType: string;
  targetPrice: number;
  condition: 'ABOVE' | 'BELOW';
  triggered: boolean;
  triggeredAt: string | null;
  createdAt: string;
}

interface PriceAlertsProps {
  stock: Stock | null;
  assetType: AssetType;
}

export function PriceAlerts({ stock, assetType }: PriceAlertsProps) {
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<PriceAlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // 폼 상태
  const [targetPrice, setTargetPrice] = useState('');
  const [condition, setCondition] = useState<'ABOVE' | 'BELOW'>('ABOVE');

  // 알림 목록 로드
  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/trading/alerts');
      if (response.ok) {
        const data = await response.json();
        setAlerts(data.alerts || []);
      }
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  // 알림 생성
  const handleCreateAlert = async () => {
    if (!stock) {
      toast({
        title: '오류',
        description: '종목을 선택해주세요.',
        variant: 'destructive',
      });
      return;
    }

    const price = parseFloat(targetPrice);
    if (!price) {
      toast({
        title: '오류',
        description: '목표 가격을 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch('/api/trading/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: stock.symbol,
          name: stock.name,
          assetType,
          targetPrice: price,
          condition,
        }),
      });

      if (!response.ok) throw new Error('Failed to create alert');

      toast({
        title: '알림 생성',
        description: `${stock.name} 가격 알림이 등록되었습니다.`,
      });

      setDialogOpen(false);
      setTargetPrice('');
      fetchAlerts();
    } catch (error) {
      console.error('Failed to create alert:', error);
      toast({
        title: '오류',
        description: '알림 생성에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  // 알림 삭제
  const handleDeleteAlert = async (id: string) => {
    try {
      const response = await fetch(`/api/trading/alerts?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete alert');

      toast({
        title: '알림 삭제',
        description: '가격 알림이 삭제되었습니다.',
      });

      fetchAlerts();
    } catch (error) {
      console.error('Failed to delete alert:', error);
      toast({
        title: '오류',
        description: '알림 삭제에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  // 현재 가격 설정
  useEffect(() => {
    if (stock && dialogOpen) {
      setTargetPrice(stock.price.toString());
    }
  }, [stock, dialogOpen]);

  // 알림 개수
  const activeAlerts = alerts.filter(a => !a.triggered).length;
  const triggeredAlerts = alerts.filter(a => a.triggered).length;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm flex items-center gap-2">
              <Bell className="w-4 h-4" />
              가격 알림
              {activeAlerts > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {activeAlerts}개 활성
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="text-xs">
              목표가 도달 시 알림
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" disabled={!stock}>
                <Plus className="w-4 h-4 mr-1" />
                알림
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>가격 알림 설정</DialogTitle>
                <DialogDescription>
                  목표 가격에 도달하면 알림을 받습니다.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 pt-4">
                {/* 종목 정보 */}
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    assetType === 'COIN' ? 'bg-amber-500/20' : 'bg-red-500/20'
                  }`}>
                    <TrendingUp className={`w-5 h-5 ${assetType === 'COIN' ? 'text-amber-500' : 'text-red-500'}`} />
                  </div>
                  <div>
                    <p className="font-medium">{stock?.name}</p>
                    <p className="text-sm text-muted-foreground">{stock?.symbol}</p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="font-medium">{stock?.price.toLocaleString()}원</p>
                  </div>
                </div>

                {/* 조건 선택 */}
                <div className="space-y-2">
                  <Label>알림 조건</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant={condition === 'ABOVE' ? 'default' : 'outline'}
                      className={condition === 'ABOVE' ? 'bg-red-500 hover:bg-red-600' : ''}
                      onClick={() => setCondition('ABOVE')}
                    >
                      <TrendingUp className="w-4 h-4 mr-2" />
                      이상
                    </Button>
                    <Button
                      type="button"
                      variant={condition === 'BELOW' ? 'default' : 'outline'}
                      className={condition === 'BELOW' ? 'bg-blue-500 hover:bg-blue-600' : ''}
                      onClick={() => setCondition('BELOW')}
                    >
                      <TrendingDown className="w-4 h-4 mr-2" />
                      이하
                    </Button>
                  </div>
                </div>

                {/* 목표 가격 */}
                <div className="space-y-2">
                  <Label htmlFor="alert-price">목표 가격</Label>
                  <Input
                    id="alert-price"
                    type="number"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                    placeholder="목표 가격 입력"
                  />
                  <p className="text-xs text-muted-foreground">
                    현재가: {stock?.price.toLocaleString()}원
                  </p>
                </div>

                <Button className="w-full" onClick={handleCreateAlert}>
                  <Bell className="w-4 h-4 mr-2" />
                  알림 등록
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
        ) : alerts.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">가격 알림이 없습니다</p>
          </div>
        ) : (
          <ScrollArea className="h-[150px]">
            <div className="space-y-2">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`flex items-center justify-between p-2 rounded-lg border ${
                    alert.triggered ? 'bg-green-50 dark:bg-green-950/20 border-green-200' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {alert.triggered ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <Bell className="w-4 h-4 text-muted-foreground" />
                    )}
                    <div>
                      <p className="font-medium text-sm">{alert.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {alert.targetPrice.toLocaleString()}원 {alert.condition === 'ABOVE' ? '이상' : '이하'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {alert.triggered ? (
                      <Badge variant="outline" className="text-xs text-green-600 border-green-300">
                        완료
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        대기중
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => handleDeleteAlert(alert.id)}
                    >
                      <Trash2 className="w-3 h-3" />
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
