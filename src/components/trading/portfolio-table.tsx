'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Holding, formatPrice, formatRate, getPriceColor, COLORS } from '@/lib/trading';
import { TrendingUp, TrendingDown, PieChart, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PortfolioTableProps {
  refreshKey?: number;
}

export function PortfolioTable({ refreshKey }: PortfolioTableProps) {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [totalEvaluation, setTotalEvaluation] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [totalProfitRate, setTotalProfitRate] = useState(0);

  const fetchPortfolio = useCallback(async () => {
    try {
      const response = await fetch('/api/trading/portfolio');
      const result = await response.json();
      if (result.success) {
        setHoldings(result.data.holdings);
        setTotalEvaluation(result.data.summary.totalEvaluation);
        setTotalProfit(result.data.summary.totalProfit);
        setTotalProfitRate(result.data.summary.totalProfitRate);
      }
    } catch (error) {
      console.error('Failed to fetch portfolio:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePrices = useCallback(async () => {
    setUpdating(true);
    try {
      await fetch('/api/trading/update-prices', { method: 'POST' });
      await fetchPortfolio();
    } catch (error) {
      console.error('Failed to update prices:', error);
    } finally {
      setUpdating(false);
    }
  }, [fetchPortfolio]);

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio, refreshKey]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-[200px] text-muted-foreground">
          로딩 중...
        </CardContent>
      </Card>
    );
  }

  if (holdings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <PieChart className="w-5 h-5" />
            포트폴리오
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
          <PieChart className="w-12 h-12 mb-2 opacity-50" />
          <p>보유한 종목이 없습니다</p>
          <p className="text-sm">매수를 통해 종목을 매입해보세요</p>
        </CardContent>
      </Card>
    );
  }

  const profitColor = getPriceColor(totalProfitRate);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <PieChart className="w-5 h-5" />
            포트폴리오
          </CardTitle>
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={updatePrices}
              disabled={updating}
              className="h-8 px-2"
            >
              <RefreshCw className={`w-4 h-4 ${updating ? 'animate-spin' : ''}`} />
            </Button>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">평가금액</div>
              <div className="font-bold">{formatPrice(totalEvaluation)}원</div>
              <div className="text-sm flex items-center justify-end gap-1" style={{ color: profitColor }}>
                {totalProfitRate > 0 && <TrendingUp className="w-3 h-3" />}
                {totalProfitRate < 0 && <TrendingDown className="w-3 h-3" />}
                {formatPrice(totalProfit)}원 ({formatRate(totalProfitRate)})
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[300px]">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[100px]">종목</TableHead>
                <TableHead className="text-right">보유수량</TableHead>
                <TableHead className="text-right">평균가</TableHead>
                <TableHead className="text-right">현재가</TableHead>
                <TableHead className="text-right">평가금액</TableHead>
                <TableHead className="text-right">수익률</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {holdings.map((holding) => {
                const color = getPriceColor(holding.profitRate);
                
                return (
                  <TableRow key={holding.id}>
                    <TableCell>
                      <div>
                        <div className="font-semibold">{holding.name}</div>
                        <div className="text-xs text-muted-foreground">{holding.symbol}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {holding.quantity.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatPrice(holding.avgPrice)}
                    </TableCell>
                    <TableCell className="text-right" style={{ color: getPriceColor(holding.changeRate) }}>
                      {formatPrice(holding.currentPrice)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatPrice(holding.evaluation)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1" style={{ color }}>
                        {holding.profitRate > 0 && <TrendingUp className="w-3 h-3" />}
                        {holding.profitRate < 0 && <TrendingDown className="w-3 h-3" />}
                        {formatRate(holding.profitRate)}
                      </div>
                      <Progress 
                        value={holding.weight} 
                        className="h-1 mt-1"
                        style={{ 
                          backgroundColor: 'rgba(128, 128, 128, 0.2)',
                        }}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
