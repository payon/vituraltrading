'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Flame, 
  Trophy, 
  Target, 
  TrendingUp,
  Calendar,
  Clock
} from 'lucide-react';
import { getTotalTopicCount } from '@/data/learning-content';
import { cn } from '@/lib/utils';

interface ProgressStats {
  completedTopics: number;
  totalTopics: number;
  currentStreak: number;
  longestStreak: number;
  lastLearnDate: string | null;
  totalQuizScore: number;
  totalQuizTaken: number;
}

interface ProgressTrackerProps {
  stats: ProgressStats;
}

export function ProgressTracker({ stats }: ProgressTrackerProps) {
  const {
    completedTopics,
    totalTopics,
    currentStreak,
    longestStreak,
    lastLearnDate,
    totalQuizScore,
    totalQuizTaken,
  } = stats;

  const completionRate = totalTopics > 0 
    ? Math.round((completedTopics / totalTopics) * 100) 
    : 0;
  const avgQuizScore = totalQuizTaken > 0 
    ? Math.round(totalQuizScore / totalQuizTaken) 
    : 0;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* 전체 진행률 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            학습 진행률
          </CardTitle>
          <Target className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{completionRate}%</div>
          <Progress value={completionRate} className="mt-2 h-2" />
          <p className="text-xs text-muted-foreground mt-2">
            {completedTopics} / {totalTopics} 토픽 완료
          </p>
        </CardContent>
      </Card>

      {/* 연속 학습 일수 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            연속 학습
          </CardTitle>
          <Flame className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold">{currentStreak}</span>
            <span className="text-sm text-muted-foreground">일</span>
          </div>
          {currentStreak > 0 && (
            <Badge variant="secondary" className="mt-2 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
              🔥 진행중
            </Badge>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            최장: {longestStreak}일
          </p>
        </CardContent>
      </Card>

      {/* 퀴즈 성적 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            퀴즈 평균
          </CardTitle>
          <Trophy className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold">{avgQuizScore}</span>
            <span className="text-sm text-muted-foreground">점</span>
          </div>
          <div className="flex items-center gap-1 mt-2">
            <Badge 
              variant={avgQuizScore >= 80 ? "default" : avgQuizScore >= 60 ? "secondary" : "outline"}
              className={cn(
                avgQuizScore >= 80 && "bg-green-600 hover:bg-green-700",
                avgQuizScore >= 60 && avgQuizScore < 80 && "bg-yellow-600 hover:bg-yellow-700"
              )}
            >
              {avgQuizScore >= 80 ? "우수" : avgQuizScore >= 60 ? "양호" : "노력 필요"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {totalQuizTaken}회 응시
          </p>
        </CardContent>
      </Card>

      {/* 마지막 학습 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            마지막 학습
          </CardTitle>
          <Clock className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-lg font-medium">
            {lastLearnDate ? (
              new Date(lastLearnDate).toLocaleDateString('ko-KR', {
                month: 'long',
                day: 'numeric',
              })
            ) : (
              "아직 없음"
            )}
          </div>
          {lastLearnDate && (
            <p className="text-xs text-muted-foreground mt-2">
              {(() => {
                const diff = Math.floor(
                  (Date.now() - new Date(lastLearnDate).getTime()) / (1000 * 60 * 60 * 24)
                );
                if (diff === 0) return "오늘 학습함";
                if (diff === 1) return "어제 학습함";
                return `${diff}일 전 학습함`;
              })()}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// 간단한 진행률 바 컴포넌트
interface SimpleProgressProps {
  completed: number;
  total: number;
  showLabel?: boolean;
  className?: string;
}

export function SimpleProgress({ 
  completed, 
  total, 
  showLabel = true,
  className 
}: SimpleProgressProps) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className={cn("space-y-2", className)}>
      {showLabel && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">진행률</span>
          <span className="font-medium">{completed}/{total}</span>
        </div>
      )}
      <Progress value={percentage} className="h-2" />
      {showLabel && (
        <div className="text-right text-xs text-muted-foreground">
          {percentage}%
        </div>
      )}
    </div>
  );
}

// 학습 요약 카드
interface LearningSummaryProps {
  stats: ProgressStats;
}

export function LearningSummary({ stats }: LearningSummaryProps) {
  const totalTopics = getTotalTopicCount();
  const completionRate = totalTopics > 0 
    ? Math.round((stats.completedTopics / totalTopics) * 100) 
    : 0;

  const getNextMilestone = () => {
    if (completionRate < 25) return { target: 25, label: "초급" };
    if (completionRate < 50) return { target: 50, label: "중급" };
    if (completionRate < 75) return { target: 75, label: "고급" };
    return { target: 100, label: "마스터" };
  };

  const milestone = getNextMilestone();
  const topicsToNextMilestone = Math.ceil(
    (milestone.target / 100) * totalTopics
  ) - stats.completedTopics;

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          학습 요약
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">다음 목표</span>
          <Badge variant="secondary">{milestone.label}</Badge>
        </div>
        
        <Progress 
          value={(stats.completedTopics / totalTopics) * 100} 
          className="h-3" 
        />
        
        <p className="text-sm text-muted-foreground">
          {milestone.label} 달성까지 <strong>{topicsToNextMilestone}</strong>개 토픽 남았습니다!
        </p>

        {stats.currentStreak > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <Flame className="h-4 w-4 text-orange-500" />
            <span>
              <strong>{stats.currentStreak}일</strong> 연속 학습 중!
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
