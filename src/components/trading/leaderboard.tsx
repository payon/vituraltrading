'use client';

/**
 * 수익률 랭킹 컴포넌트
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Trophy,
  Medal,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Crown,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RankingUser {
  rank: number;
  id: string;
  name: string;
  email: string;
  initialBalance: number;
  currentBalance: number;
  profit: number;
  returnRate: number;
  investmentStyle: string;
}

interface LeaderboardProps {
  className?: string;
}

export function Leaderboard({ className }: LeaderboardProps) {
  const [rankings, setRankings] = useState<RankingUser[]>([]);
  const [myRanking, setMyRanking] = useState<RankingUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('all');

  useEffect(() => {
    fetchLeaderboard();
  }, [period]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/trading/leaderboard?period=${period}&limit=20`);
      if (response.ok) {
        const data = await response.json();
        setRankings(data.rankings || []);
        setMyRanking(data.myRanking);
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  // 금액 포맷팅
  const formatCurrency = (amount: number) => {
    if (Math.abs(amount) >= 100000000) {
      return (amount / 100000000).toFixed(1) + '억';
    }
    if (Math.abs(amount) >= 10000) {
      return (amount / 10000).toFixed(0) + '만';
    }
    return amount.toLocaleString('ko-KR');
  };

  // 랭킹 아이콘
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Medal className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-medium">{rank}</span>;
    }
  };

  // 투자 성향 뱃지
  const getStyleBadge = (style: string) => {
    switch (style) {
      case 'conservative':
        return <Badge variant="outline" className="text-xs">안정형</Badge>;
      case 'aggressive':
        return <Badge variant="outline" className="text-xs">공격형</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">중립형</Badge>;
    }
  };

  // 상위 3명
  const topThree = rankings.slice(0, 3);
  const others = rankings.slice(3);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              수익률 랭킹
            </CardTitle>
            <CardDescription>
              전체 사용자 수익률 순위
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={fetchLeaderboard}>
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </Button>
        </div>

        {/* 기간 선택 */}
        <Tabs value={period} onValueChange={setPeriod} className="mt-2">
          <TabsList className="h-8">
            <TabsTrigger value="all" className="text-xs">전체</TabsTrigger>
            <TabsTrigger value="weekly" className="text-xs" disabled>주간</TabsTrigger>
            <TabsTrigger value="monthly" className="text-xs" disabled>월간</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>

      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : rankings.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>랭킹 데이터가 없습니다</p>
          </div>
        ) : (
          <>
            {/* 상위 3명 */}
            <div className="grid grid-cols-3 gap-2">
              {topThree.map((user, index) => (
                <div
                  key={user.id}
                  className={cn(
                    "relative p-3 rounded-lg text-center",
                    index === 0 && "bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800",
                    index === 1 && "bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-700",
                    index === 2 && "bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800"
                  )}
                >
                  <div className="flex justify-center mb-1">
                    {getRankIcon(user.rank)}
                  </div>
                  <p className="font-medium text-sm truncate">{user.name}</p>
                  <p className={cn(
                    "text-lg font-bold",
                    user.returnRate >= 0 ? "text-red-500" : "text-blue-500"
                  )}>
                    {user.returnRate >= 0 ? '+' : ''}{user.returnRate.toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(user.currentBalance)}원
                  </p>
                </div>
              ))}
            </div>

            {/* 내 랭킹 */}
            {myRanking && !topThree.find(u => u.id === myRanking.id) && (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 flex items-center justify-center bg-primary/10 rounded-full font-bold text-primary">
                      {myRanking.rank}
                    </span>
                    <div>
                      <p className="font-medium">{myRanking.name} (나)</p>
                      <p className="text-xs text-muted-foreground">{myRanking.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      "font-bold",
                      myRanking.returnRate >= 0 ? "text-red-500" : "text-blue-500"
                    )}>
                      {myRanking.returnRate >= 0 ? '+' : ''}{myRanking.returnRate.toFixed(2)}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(myRanking.currentBalance)}원
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 기타 랭킹 */}
            <ScrollArea className="h-[250px]">
              <div className="space-y-1">
                {others.map((user) => (
                  <div
                    key={user.id}
                    className={cn(
                      "flex items-center justify-between p-2 rounded-lg",
                      user.id === myRanking?.id && "bg-primary/5"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 text-center text-sm font-medium text-muted-foreground">
                        {user.rank}
                      </span>
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white text-sm font-medium">
                        {user.name[0]}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{user.name}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                          {getStyleBadge(user.investmentStyle)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        "font-medium text-sm",
                        user.returnRate >= 0 ? "text-red-500" : "text-blue-500"
                      )}>
                        {user.returnRate >= 0 ? '+' : ''}{user.returnRate.toFixed(2)}%
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(user.currentBalance)}원
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </>
        )}
      </CardContent>
    </Card>
  );
}
