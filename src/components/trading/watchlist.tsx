'use client';

/**
 * 관심종목 (즐겨찾기) 컴포넌트
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Star, 
  StarOff, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw,
  Bitcoin
} from 'lucide-react';
import { AssetType } from '@/lib/trading';

interface WatchlistItem {
  id: string;
  symbol: string;
  name: string;
  assetType: 'STOCK' | 'COIN';
  priceAlertEnabled: boolean;
  targetPrice: number | null;
  createdAt: string;
}

interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

interface WatchlistProps {
  assetType: AssetType;
  onSelectStock: (stock: StockData) => void;
  selectedSymbol?: string;
  stocks: StockData[]; // 종목 리스트에서 전달받음
}

export function Watchlist({ assetType, onSelectStock, selectedSymbol, stocks }: WatchlistProps) {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  // 관심종목 로드
  useEffect(() => {
    fetchWatchlist();
  }, []);

  const fetchWatchlist = async () => {
    try {
      const response = await fetch('/api/trading/watchlist');
      if (response.ok) {
        const data = await response.json();
        setWatchlist(data.watchlist || []);
      }
    } catch (error) {
      console.error('Failed to fetch watchlist:', error);
    } finally {
      setLoading(false);
    }
  };

  // 관심종목 추가
  const addToWatchlist = async (stock: StockData) => {
    try {
      const response = await fetch('/api/trading/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: stock.symbol,
          name: stock.name,
          assetType: assetType,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setWatchlist([...watchlist, data.watchlistItem]);
      }
    } catch (error) {
      console.error('Failed to add to watchlist:', error);
    }
  };

  // 관심종목 삭제
  const removeFromWatchlist = async (id: string) => {
    try {
      const response = await fetch(`/api/trading/watchlist?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setWatchlist(watchlist.filter(item => item.id !== id));
      }
    } catch (error) {
      console.error('Failed to remove from watchlist:', error);
    }
  };

  // 현재 자산 타입에 해당하는 관심종목 필터링
  const filteredWatchlist = watchlist.filter(
    item => item.assetType === assetType
  );

  // 관심종목에 등록된 종목인지 확인
  const isWatched = (symbol: string) => {
    return watchlist.some(
      item => item.symbol === symbol && item.assetType === assetType
    );
  };

  // 관심종목 ID 가져오기
  const getWatchlistId = (symbol: string) => {
    const item = watchlist.find(
      item => item.symbol === symbol && item.assetType === assetType
    );
    return item?.id;
  };

  // 토글 관심종목
  const toggleWatchlist = (stock: StockData) => {
    if (isWatched(stock.symbol)) {
      const id = getWatchlistId(stock.symbol);
      if (id) removeFromWatchlist(id);
    } else {
      addToWatchlist(stock);
    }
  };

  // 관심종목의 현재 가격 정보 가져오기
  const getStockPrice = (symbol: string): StockData | undefined => {
    return stocks.find(s => s.symbol === symbol);
  };

  // 가격 포맷팅
  const formatPrice = (price: number) => {
    if (assetType === 'COIN') {
      return price.toLocaleString('en-US', { maximumFractionDigits: 2 });
    }
    return price.toLocaleString('ko-KR');
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Star className="w-4 h-4" />
            관심종목
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-500" />
            관심종목
            <Badge variant="secondary" className="text-xs">
              {filteredWatchlist.length}
            </Badge>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={fetchWatchlist}>
            <RefreshCw className="w-3 h-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {filteredWatchlist.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm">
            <Star className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>관심종목을 추가하세요</p>
            <p className="text-xs mt-1">종목 리스트에서 ⭐ 버튼을 클릭</p>
          </div>
        ) : (
          <ScrollArea className="h-[200px]">
            <div className="space-y-1">
              {filteredWatchlist.map((item) => {
                const stockPrice = getStockPrice(item.symbol);
                if (!stockPrice) return null;

                return (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                      selectedSymbol === item.symbol
                        ? 'bg-primary/10 border border-primary/20'
                        : 'hover:bg-muted'
                    }`}
                    onClick={() => onSelectStock(stockPrice)}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        assetType === 'COIN' 
                          ? 'bg-amber-500/20' 
                          : 'bg-red-500/20'
                      }`}>
                        {assetType === 'COIN' ? (
                          <Bitcoin className="w-4 h-4 text-amber-500" />
                        ) : (
                          <TrendingUp className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.symbol}</p>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <div>
                        <p className="font-medium text-sm">
                          {formatPrice(stockPrice.price)}
                        </p>
                        <p className={`text-xs ${
                          stockPrice.changePercent >= 0 
                            ? 'text-red-500' 
                            : 'text-blue-500'
                        }`}>
                          {stockPrice.changePercent >= 0 ? '+' : ''}
                          {stockPrice.changePercent.toFixed(2)}%
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromWatchlist(item.id);
                        }}
                      >
                        <StarOff className="w-3 h-3 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

// 관심종목 토글 버튼 컴포넌트
interface WatchlistButtonProps {
  stock: StockData;
  assetType: AssetType;
  watchlist: WatchlistItem[];
  onToggle: () => void;
}

export function WatchlistButton({ stock, assetType, watchlist, onToggle }: WatchlistButtonProps) {
  const isWatched = watchlist.some(
    item => item.symbol === stock.symbol && item.assetType === assetType
  );

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
    >
      <Star className={`w-4 h-4 ${isWatched ? 'fill-yellow-500 text-yellow-500' : ''}`} />
    </Button>
  );
}
