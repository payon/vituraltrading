'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  Brain,
  Calendar,
  Target,
  Loader2,
  BarChart2,
  PieChart as PieChartIcon,
} from 'lucide-react';

interface Stats {
  totalDiaries: number;
  monthlyDiaries: number;
  currentStreak: number;
  longestStreak: number;
  emotionStats: Record<string, { count: number; avgIntensity: number; totalIntensity: number }>;
  dominantEmotion: {
    type: string;
    label: string;
    count: number;
    avgIntensity: number;
    color: string;
  } | null;
  styleDistribution: Record<string, number>;
  avgSelfRating: number;
  last7Days: { date: string; count: number }[];
  emotionTypeMap: Record<string, string>;
  emotionColors: Record<string, string>;
}

interface InvestmentPatternProps {
  refreshKey?: number;
}

// 투자 성향 색상
const styleColors: Record<string, string> = {
  CONSERVATIVE: '#3B82F6', // 파랑
  MODERATE: '#8B5CF6',     // 보라
  AGGRESSIVE: '#EF4444',   // 빨강
};

export function InvestmentPattern({ refreshKey = 0 }: InvestmentPatternProps) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 통계 로드
  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/diary/stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [refreshKey]);

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart2 className="w-5 h-5" />
            투자 패턴 분석
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart2 className="w-5 h-5" />
            투자 패턴 분석
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-[300px]">
          <PieChartIcon className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground text-center">
            분석할 데이터가 부족합니다
          </p>
        </CardContent>
      </Card>
    );
  }

  // 감정 분포 데이터 (차트용)
  const emotionChartData = Object.entries(stats.emotionStats).map(([type, data]) => ({
    name: stats.emotionTypeMap[type] || type,
    count: data.count,
    avgIntensity: data.avgIntensity.toFixed(1),
    color: stats.emotionColors[type],
  }));

  // 투자 성향 분포 데이터 (파이차트용)
  const styleChartData = Object.entries(stats.styleDistribution).map(([style, count]) => ({
    name: style === 'CONSERVATIVE' ? '보수적' : style === 'MODERATE' ? '중립적' : '공격적',
    value: count,
    color: styleColors[style],
  }));

  // 7일간 일기 작성 현황
  const weeklyData = stats.last7Days.map((d) => ({
    date: new Date(d.date).toLocaleDateString('ko-KR', { weekday: 'short' }),
    count: d.count,
  }));

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart2 className="w-5 h-5" />
          투자 패턴 분석
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[calc(100vh-350px)] pr-4">
          <div className="space-y-6">
            {/* 요약 통계 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="text-2xl font-bold">{stats.totalDiaries}</div>
                <div className="text-xs text-muted-foreground">총 일기 수</div>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="text-2xl font-bold">{stats.monthlyDiaries}</div>
                <div className="text-xs text-muted-foreground">이번 달 작성</div>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="text-2xl font-bold flex items-center gap-1">
                  🔥 {stats.currentStreak}
                </div>
                <div className="text-xs text-muted-foreground">연속 작성</div>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="text-2xl font-bold">{stats.avgSelfRating.toFixed(1)}</div>
                <div className="text-xs text-muted-foreground">평균 자가평가</div>
              </div>
            </div>

            {/* 주요 감정 */}
            {stats.dominantEmotion && (
              <div className="p-4 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="w-4 h-4" />
                  <span className="text-sm font-medium">가장 많이 느낀 감정</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    className="text-base py-1 px-3"
                    style={{
                      backgroundColor: stats.dominantEmotion.color,
                      color: 'white',
                    }}
                  >
                    {stats.dominantEmotion.label}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {stats.dominantEmotion.count}회 / 평균 강도 {stats.dominantEmotion.avgIntensity.toFixed(1)}
                  </span>
                </div>
              </div>
            )}

            {/* 7일간 작성 현황 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Calendar className="w-4 h-4" />
                최근 7일 작성 현황
              </div>
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 감정 분포 */}
            {emotionChartData.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Target className="w-4 h-4" />
                  감정 분포
                </div>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={emotionChartData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis type="number" tick={{ fontSize: 12 }} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={50} />
                      <Tooltip />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                        {emotionChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* 투자 성향 분포 */}
            {styleChartData.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <TrendingUp className="w-4 h-4" />
                  투자 성향 분포
                </div>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={styleChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {styleChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* 감정 강도 추이 (더미 데이터) */}
            {stats.totalDiaries > 2 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Brain className="w-4 h-4" />
                  감정 강도 추이
                </div>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} domain={[0, 10]} />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#8B5CF6"
                        strokeWidth={2}
                        dot={{ fill: '#8B5CF6' }}
                        name="감정 강도"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
