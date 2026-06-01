'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Account, formatPrice, formatRate, getPriceColor, COLORS } from '@/lib/trading';
import { TrendingUp, TrendingDown, Wallet, PiggyBank } from 'lucide-react';

interface AccountCardProps {
  refreshKey?: number;
}

export function AccountCard({ refreshKey }: AccountCardProps) {
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);

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
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccount();
  }, [fetchAccount, refreshKey]);

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <CardHeader>
          <Skeleton className="h-6 w-24 bg-gray-700" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-40 bg-gray-700" />
          <Skeleton className="h-4 w-full bg-gray-700" />
        </CardContent>
      </Card>
    );
  }

  if (!account) return null;

  const profitColor = getPriceColor(account.profitRate);
  const isProfit = account.profitRate > 0;
  const isLoss = account.profitRate < 0;

  return (
    <Card className="bg-gradient-to-br from-gray-900 to-gray-800 text-white border-0">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium text-gray-300">내 계좌</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 총 자산 */}
        <div>
          <div className="text-sm text-gray-400 mb-1">총 자산</div>
          <div className="text-3xl font-bold">
            {formatPrice(account.totalAssets)}원
          </div>
          <div className="flex items-center gap-2 mt-1">
            {isProfit && <TrendingUp className="w-4 h-4" style={{ color: COLORS.RISE }} />}
            {isLoss && <TrendingDown className="w-4 h-4" style={{ color: COLORS.FALL }} />}
            <span style={{ color: profitColor }} className="font-medium">
              {isProfit ? '+' : ''}{formatPrice(account.profit)}원 ({formatRate(account.profitRate)})
            </span>
          </div>
        </div>

        {/* 상세 정보 */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-700">
          <div>
            <div className="flex items-center gap-1 text-gray-400 text-sm mb-1">
              <Wallet className="w-3 h-3" />
              예수금
            </div>
            <div className="text-lg font-semibold">{formatPrice(account.balance)}원</div>
          </div>
          <div>
            <div className="flex items-center gap-1 text-gray-400 text-sm mb-1">
              <PiggyBank className="w-3 h-3" />
              평가금액
            </div>
            <div className="text-lg font-semibold">{formatPrice(account.evaluation)}원</div>
          </div>
        </div>

        {/* 수익률 바 */}
        <div className="space-y-1">
          <div className="flex justify-between text-sm text-gray-400">
            <span>총 수익률</span>
            <span style={{ color: profitColor }}>{formatRate(account.profitRate)}</span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-500"
              style={{ 
                width: `${Math.min(Math.abs(account.profitRate), 100)}%`,
                backgroundColor: profitColor
              }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
