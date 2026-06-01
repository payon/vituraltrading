'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Calendar,
  ChevronRight,
  FileText,
  Star,
  Trash2,
  Clock,
  Loader2,
} from 'lucide-react';

export interface DiaryEntry {
  id: string;
  date: string;
  content?: string | null;
  tradeSummary?: string | null;
  tradeReason?: string | null;
  emotionState?: string | null;
  emotionScore?: number | null;
  emotions?: string | null;
  selfRating?: number | null;
  investmentStyle?: string | null;
  aiAnalysis?: string | null;
  createdAt: string;
}

interface DiaryHistoryProps {
  onSelectDiary: (diary: DiaryEntry) => void;
  refreshKey?: number;
}

// 감정 라벨 매핑
const emotionLabels: Record<string, string> = {
  GREED: '욕심',
  FEAR: '공포',
  HOPE: '희망',
  ANXIETY: '불안',
  CONFIDENCE: '자신감',
};

// 감정 색상 매핑
const emotionColors: Record<string, string> = {
  GREED: 'rgb(255, 152, 0)',
  FEAR: 'rgb(156, 39, 176)',
  HOPE: 'rgb(76, 175, 80)',
  ANXIETY: 'rgb(255, 82, 82)',
  CONFIDENCE: 'rgb(33, 150, 243)',
};

// 투자 성향 라벨
const styleLabels: Record<string, string> = {
  CONSERVATIVE: '보수적',
  MODERATE: '중립적',
  AGGRESSIVE: '공격적',
};

export function DiaryHistory({ onSelectDiary, refreshKey = 0 }: DiaryHistoryProps) {
  const [diaries, setDiaries] = useState<DiaryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // 일기 목록 로드
  const fetchDiaries = async (pageNum: number = 0) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/diary?limit=10&offset=${pageNum * 10}`);
      if (res.ok) {
        const data = await res.json();
        if (pageNum === 0) {
          setDiaries(data.diaries);
        } else {
          setDiaries((prev) => [...prev, ...data.diaries]);
        }
        setHasMore(data.hasMore);
      }
    } catch (error) {
      console.error('Failed to fetch diaries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 초기 로드 및 refreshKey 변경 시 리로드
  useEffect(() => {
    setPage(0);
    fetchDiaries(0);
  }, [refreshKey]);

  // 더 불러오기
  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchDiaries(nextPage);
  };

  // 일기 삭제
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm('정말 이 일기를 삭제하시겠습니까?')) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/diary?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setDiaries((prev) => prev.filter((d) => d.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete diary:', error);
    } finally {
      setDeletingId(null);
    }
  };

  // 감정 파싱
  const parseEmotions = (emotionsStr: string | null): { type: string; intensity: number }[] => {
    if (!emotionsStr) return [];
    try {
      return JSON.parse(emotionsStr);
    } catch {
      return [];
    }
  };

  // 날짜 포맷
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', {
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    });
  };

  // 요약 텍스트 생성
  const getSummaryText = (diary: DiaryEntry) => {
    if (diary.content) {
      return diary.content.length > 50
        ? diary.content.substring(0, 50) + '...'
        : diary.content;
    }
    if (diary.tradeSummary) {
      return diary.tradeSummary.substring(0, 50) + '...';
    }
    return '내용 없음';
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          일기 목록
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[calc(100vh-350px)]">
          {isLoading && page === 0 ? (
            // 로딩 스켈레톤
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-3 rounded-lg border">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-3 w-full mb-1" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              ))}
            </div>
          ) : diaries.length === 0 ? (
            // 빈 상태
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm">아직 작성된 일기가 없습니다</p>
              <p className="text-xs mt-1">첫 번째 투자 일기를 작성해보세요!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {diaries.map((diary) => {
                const emotions = parseEmotions(diary.emotions);
                const primaryEmotion = emotions.sort((a, b) => b.intensity - a.intensity)[0];

                return (
                  <div
                    key={diary.id}
                    className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors group"
                    onClick={() => onSelectDiary(diary)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {formatDate(diary.date)}
                        </span>
                        {diary.investmentStyle && (
                          <Badge variant="outline" className="text-xs">
                            {styleLabels[diary.investmentStyle] || diary.investmentStyle}
                          </Badge>
                        )}
                        {diary.aiAnalysis && (
                          <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">
                            AI 분석 완료
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => handleDelete(diary.id, e)}
                        disabled={deletingId === diary.id}
                      >
                        {deletingId === diary.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3 text-red-500" />
                        )}
                      </Button>
                    </div>

                    <p className="text-sm text-muted-foreground mb-2">
                      {getSummaryText(diary)}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {primaryEmotion && (
                          <Badge
                            className="text-xs"
                            style={{
                              backgroundColor: emotionColors[primaryEmotion.type],
                              color: 'white',
                            }}
                          >
                            {emotionLabels[primaryEmotion.type]} {primaryEmotion.intensity}
                          </Badge>
                        )}
                        {diary.selfRating && (
                          <Badge variant="outline" className="text-xs gap-0.5">
                            <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                            {diary.selfRating}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {new Date(diary.createdAt).toLocaleTimeString('ko-KR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* 더 불러오기 */}
              {hasMore && (
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={loadMore}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      더 불러오기
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
