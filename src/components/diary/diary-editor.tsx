'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Calendar,
  FileText,
  Target,
  Star,
  Sparkles,
  Loader2,
  Save,
  RefreshCcw,
} from 'lucide-react';
import { EmotionChecker, type EmotionData } from './emotion-checker';

interface TradeSummary {
  symbol: string;
  name: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  totalAmount: number;
}

interface DiaryEditorProps {
  diary?: {
    id: string;
    date: string;
    content?: string | null;
    tradeSummary?: string | null;
    tradeReason?: string | null;
    emotionState?: string | null;
    emotionScore?: number | null;
    emotions?: string | null;
    selfRating?: number | null;
  } | null;
  tradeSummaries?: TradeSummary[];
  onSave: (diary: {
    date: string;
    content: string;
    tradeSummary: string;
    tradeReason: string;
    emotionState: string;
    emotionScore: number;
    emotions: EmotionData[];
    selfRating: number;
  }) => Promise<void>;
  onAnalyze: () => void;
  isAnalyzing?: boolean;
}

export function DiaryEditor({
  diary,
  tradeSummaries = [],
  onSave,
  onAnalyze,
  isAnalyzing = false,
}: DiaryEditorProps) {
  // 상태
  const [date, setDate] = useState(diary?.date || new Date().toISOString().split('T')[0]);
  const [content, setContent] = useState(diary?.content || '');
  const [tradeSummary, setTradeSummary] = useState(diary?.tradeSummary || '');
  const [tradeReason, setTradeReason] = useState(diary?.tradeReason || '');
  const [emotions, setEmotions] = useState<EmotionData[]>([]);
  const [selfRating, setSelfRating] = useState(diary?.selfRating || 3);
  const [isSaving, setIsSaving] = useState(false);

  // 기존 일기 데이터 로드
  useEffect(() => {
    if (diary) {
      setDate(diary.date.split('T')[0]);
      setContent(diary.content || '');
      setTradeSummary(diary.tradeSummary || '');
      setTradeReason(diary.tradeReason || '');
      setSelfRating(diary.selfRating || 3);
      if (diary.emotions) {
        try {
          setEmotions(JSON.parse(diary.emotions));
        } catch {
          // 파싱 실패 시 무시
        }
      }
    }
  }, [diary]);

  // 오늘의 매매 내역 자동 불러오기
  useEffect(() => {
    const fetchTodayTrades = async () => {
      if (!diary && tradeSummaries.length === 0) {
        try {
          const res = await fetch(`/api/trading/history?date=${date}`);
          if (res.ok) {
            const data = await res.json();
            if (data.transactions && data.transactions.length > 0) {
              const summary = data.transactions
                .map((t: TradeSummary) => {
                  const typeLabel = t.type === 'BUY' ? '매수' : '매도';
                  return `- ${t.name} ${typeLabel} ${t.quantity}주 @ ${t.price.toLocaleString()}원`;
                })
                .join('\n');
              setTradeSummary(summary);
            }
          }
        } catch (error) {
          console.error('Failed to fetch trades:', error);
        }
      }
    };
    fetchTodayTrades();
  }, [date, diary, tradeSummaries.length]);

  // 주요 감정 계산
  const primaryEmotion = emotions.length > 0
    ? emotions.sort((a, b) => b.intensity - a.intensity)[0]
    : null;

  // 감정 점수 계산 (평균 강도)
  const emotionScore = emotions.length > 0
    ? Math.round(emotions.reduce((sum, e) => sum + e.intensity, 0) / emotions.length)
    : 0;

  // 저장 핸들러
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        date,
        content,
        tradeSummary,
        tradeReason,
        emotionState: primaryEmotion?.type || '',
        emotionScore,
        emotions,
        selfRating,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5" />
            투자 일기 작성
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onAnalyze}
              disabled={isAnalyzing || !content}
            >
              {isAnalyzing ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-1" />
              )}
              AI 분석
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-1" />
              )}
              저장
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[calc(100vh-350px)] pr-4">
          <div className="space-y-6">
            {/* 날짜 선택 */}
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-auto"
              />
              <Badge variant="secondary">
                {new Date(date).toLocaleDateString('ko-KR', {
                  weekday: 'long',
                })}
              </Badge>
            </div>

            <Separator />

            {/* 매매 내역 */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                오늘의 매매 내역
              </Label>
              <Textarea
                placeholder="오늘 매매한 종목과 내역을 기록하세요..."
                value={tradeSummary}
                onChange={(e) => setTradeSummary(e.target.value)}
                rows={3}
                className="resize-none"
              />
              {tradeSummary && (
                <p className="text-xs text-muted-foreground">
                  * 매매 내역이 자동으로 불러와졌습니다
                </p>
              )}
            </div>

            {/* 매매 이유 */}
            <div className="space-y-2">
              <Label>매매 이유</Label>
              <Textarea
                placeholder="왜 이 매매를 결정했나요? (기술적 분석, 뉴스, 직감 등)"
                value={tradeReason}
                onChange={(e) => setTradeReason(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>

            <Separator />

            {/* 감정 체크 */}
            <EmotionChecker
              selectedEmotions={emotions}
              onChange={setEmotions}
            />

            <Separator />

            {/* 일기 내용 */}
            <div className="space-y-2">
              <Label>오늘의 투자 일기</Label>
              <Textarea
                placeholder="오늘 투자하며 느낀 점, 배운 점, 내일의 계획 등을 자유롭게 작성하세요..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                className="resize-none"
              />
            </div>

            <Separator />

            {/* 자가 평가 */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500" />
                오늘의 투자 자가 평가
              </Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[selfRating]}
                  onValueChange={(value) => setSelfRating(value[0])}
                  min={1}
                  max={5}
                  step={1}
                  className="flex-1"
                />
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${
                        star <= selfRating
                          ? 'fill-yellow-500 text-yellow-500'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>개선 필요</span>
                <span>보통</span>
                <span>완벽해요!</span>
              </div>
            </div>

            {/* 요약 */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="text-sm font-medium">작성 내용 요약</div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">
                  {content.length}자 작성
                </Badge>
                <Badge variant="outline">
                  감정 {emotions.length}개 선택
                </Badge>
                <Badge variant="outline">
                  자가평가 {selfRating}점
                </Badge>
                {primaryEmotion && (
                  <Badge
                    style={{
                      backgroundColor: getEmotionColor(primaryEmotion.type),
                      color: 'white',
                    }}
                  >
                    주요 감정: {getEmotionLabel(primaryEmotion.type)}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// 감정 라벨/색상 헬퍼 함수
function getEmotionLabel(type: string): string {
  const labels: Record<string, string> = {
    GREED: '욕심',
    FEAR: '공포',
    HOPE: '희망',
    ANXIETY: '불안',
    CONFIDENCE: '자신감',
  };
  return labels[type] || type;
}

function getEmotionColor(type: string): string {
  const colors: Record<string, string> = {
    GREED: 'rgb(255, 152, 0)',
    FEAR: 'rgb(156, 39, 176)',
    HOPE: 'rgb(76, 175, 80)',
    ANXIETY: 'rgb(255, 82, 82)',
    CONFIDENCE: 'rgb(33, 150, 243)',
  };
  return colors[type] || 'rgb(128, 128, 128)';
}
