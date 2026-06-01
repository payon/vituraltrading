'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Sparkles,
  TrendingUp,
  Brain,
  Target,
  ThumbsUp,
  AlertTriangle,
  MessageSquare,
  Loader2,
  Lightbulb,
} from 'lucide-react';

// 투자 성향 한글 매핑
const investmentStyleLabels: Record<string, string> = {
  CONSERVATIVE: '보수적',
  MODERATE: '중립적',
  AGGRESSIVE: '공격적',
};

// 투자 성향 색상
const investmentStyleColors: Record<string, string> = {
  CONSERVATIVE: 'bg-blue-100 text-blue-800',
  MODERATE: 'bg-gray-100 text-gray-800',
  AGGRESSIVE: 'bg-red-100 text-red-800',
};

export interface AIAnalysisResult {
  tradePatternAnalysis?: string;
  emotionImpact?: string;
  investmentStyle?: string;
  investmentStyleLabel?: string;
  improvements?: string[];
  praises?: string[];
  warnings?: string[];
  overallComment?: string;
  emotionInsight?: string;
}

interface AIAnalysisProps {
  analysis: AIAnalysisResult | null;
  isLoading?: boolean;
  cached?: boolean;
}

export function AIAnalysis({ analysis, isLoading = false, cached = false }: AIAnalysisProps) {
  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            AI 분석
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-[300px]">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500 mb-4" />
          <p className="text-muted-foreground">AI가 일기를 분석하고 있습니다...</p>
          <p className="text-xs text-muted-foreground mt-1">잠시만 기다려주세요</p>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            AI 분석
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-[300px]">
          <MessageSquare className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground text-center">
            일기를 작성하고<br />AI 분석을 요청해주세요
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            AI 분석 결과
          </CardTitle>
          {cached && (
            <Badge variant="secondary" className="text-xs">
              저장된 분석
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[calc(100vh-350px)] pr-4">
          <div className="space-y-6">
            {/* 투자 성향 */}
            {analysis.investmentStyle && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">투자 성향:</span>
                <Badge className={investmentStyleColors[analysis.investmentStyle] || ''}>
                  {analysis.investmentStyleLabel || investmentStyleLabels[analysis.investmentStyle] || analysis.investmentStyle}
                </Badge>
              </div>
            )}

            {/* 매매 패턴 분석 */}
            {analysis.tradePatternAnalysis && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                  매매 패턴 분석
                </div>
                <p className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
                  {analysis.tradePatternAnalysis}
                </p>
              </div>
            )}

            <Separator />

            {/* 감정 영향 분석 */}
            {analysis.emotionImpact && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Brain className="w-4 h-4 text-purple-500" />
                  감정이 투자에 미친 영향
                </div>
                <p className="text-sm text-muted-foreground bg-purple-50 dark:bg-purple-950/20 p-3 rounded-lg">
                  {analysis.emotionImpact}
                </p>
              </div>
            )}

            {/* 감정 인사이트 */}
            {analysis.emotionInsight && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Brain className="w-4 h-4 text-indigo-500" />
                  감정 인사이트
                </div>
                <p className="text-sm text-muted-foreground">{analysis.emotionInsight}</p>
              </div>
            )}

            <Separator />

            {/* 칭찬할 점 */}
            {analysis.praises && analysis.praises.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-green-600">
                  <ThumbsUp className="w-4 h-4" />
                  칭찬할 점
                </div>
                <ul className="space-y-1.5">
                  {analysis.praises.map((praise, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>{praise}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 개선점 */}
            {analysis.improvements && analysis.improvements.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-amber-600">
                  <Target className="w-4 h-4" />
                  개선 제안
                </div>
                <ul className="space-y-1.5">
                  {analysis.improvements.map((improvement, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                      <span>{improvement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 주의할 점 */}
            {analysis.warnings && analysis.warnings.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-red-600">
                  <AlertTriangle className="w-4 h-4" />
                  주의할 점
                </div>
                <ul className="space-y-1.5">
                  {analysis.warnings.map((warning, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="text-red-500 mt-0.5">⚠</span>
                      <span>{warning}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Separator />

            {/* 종합 코멘트 */}
            {analysis.overallComment && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <MessageSquare className="w-4 h-4" />
                  종합 코멘트
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 p-4 rounded-lg">
                  <p className="text-sm">{analysis.overallComment}</p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
