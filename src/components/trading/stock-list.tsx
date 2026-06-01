'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Stock, formatPrice, formatRate, getPriceColor, COLORS, AssetType } from '@/lib/trading';
import { Search, TrendingUp, TrendingDown } from 'lucide-react';

interface StockListProps {
  assetType: AssetType;
  onSelectStock: (stock: Stock) => void;
  selectedSymbol?: string;
}

export function StockList({ assetType, onSelectStock, selectedSymbol }: StockListProps) {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStocks();
  }, [assetType]);

  const fetchStocks = async () => {
    setLoading(true);
    try {
      const endpoint = assetType === 'STOCK' ? '/api/trading/stocks' : '/api/trading/coins';
      const response = await fetch(endpoint);
      const result = await response.json();
      if (result.success) {
        setStocks(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch stocks:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStocks = stocks.filter(stock => 
    stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    stock.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 인기 종목 (거래량 기준)
  const popularStocks = [...stocks].sort((a, b) => b.volume - a.volume).slice(0, 5);
  
  // 상승 종목
  const risingStocks = [...stocks].filter(s => s.changeRate > 0).sort((a, b) => b.changeRate - a.changeRate).slice(0, 5);
  
  // 하락 종목
  const fallingStocks = [...stocks].filter(s => s.changeRate < 0).sort((a, b) => a.changeRate - b.changeRate).slice(0, 5);

  const renderStockItem = (stock: Stock) => {
    const color = getPriceColor(stock.changeRate);
    const isSelected = selectedSymbol === stock.symbol;
    
    return (
      <div
        key={stock.symbol}
        className={`p-3 rounded-lg cursor-pointer transition-all hover:bg-muted ${
          isSelected ? 'bg-muted border-2 border-primary' : 'border border-transparent'
        }`}
        onClick={() => onSelectStock(stock)}
      >
        <div className="flex justify-between items-center">
          <div>
            <div className="font-semibold">{stock.name}</div>
            <div className="text-sm text-muted-foreground">
              {stock.symbol}
              {stock.sector && <span className="ml-2 text-xs">({stock.sector})</span>}
            </div>
          </div>
          <div className="text-right">
            <div className="font-bold">{formatPrice(stock.currentPrice, assetType)}원</div>
            <div 
              className="text-sm font-medium flex items-center justify-end gap-1"
              style={{ color }}
            >
              {stock.changeRate > 0 && <TrendingUp className="w-3 h-3" />}
              {stock.changeRate < 0 && <TrendingDown className="w-3 h-3" />}
              {formatRate(stock.changeRate)}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">
          {assetType === 'STOCK' ? '주식' : '코인'} 종목
        </CardTitle>
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="종목명/코드 검색"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-4">
            <TabsTrigger value="all" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
              전체
            </TabsTrigger>
            <TabsTrigger value="popular" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
              인기
            </TabsTrigger>
            <TabsTrigger value="rising" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
              상승
            </TabsTrigger>
            <TabsTrigger value="falling" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
              하락
            </TabsTrigger>
          </TabsList>
          
          <ScrollArea className="h-[400px]">
            <div className="p-4 space-y-1">
              <TabsContent value="all" className="mt-0">
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">로딩 중...</div>
                ) : filteredStocks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">검색 결과가 없습니다</div>
                ) : (
                  filteredStocks.map(renderStockItem)
                )}
              </TabsContent>
              
              <TabsContent value="popular" className="mt-0">
                {popularStocks.map(renderStockItem)}
              </TabsContent>
              
              <TabsContent value="rising" className="mt-0">
                {risingStocks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">상승 종목이 없습니다</div>
                ) : (
                  risingStocks.map(renderStockItem)
                )}
              </TabsContent>
              
              <TabsContent value="falling" className="mt-0">
                {fallingStocks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">하락 종목이 없습니다</div>
                ) : (
                  fallingStocks.map(renderStockItem)
                )}
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
      </CardContent>
    </Card>
  );
}
