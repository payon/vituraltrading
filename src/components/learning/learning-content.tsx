'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  BookOpen, 
  Award,
  ListChecks
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import type { LearningTopic, LearningCategory } from '@/data/learning-content';

interface LearningContentProps {
  topic: LearningTopic;
  category: LearningCategory;
  isCompleted: boolean;
  hasNext: boolean;
  hasPrev: boolean;
  onMarkComplete: () => void;
  onOpenQuiz: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export function LearningContent({
  topic,
  category,
  isCompleted,
  hasNext,
  hasPrev,
  onMarkComplete,
  onOpenQuiz,
  onPrev,
  onNext,
}: LearningContentProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {category.name}
          </Badge>
          {isCompleted && (
            <Badge className="bg-green-600 hover:bg-green-700">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              완료
            </Badge>
          )}
        </div>
        {topic.quiz && topic.quiz.length > 0 && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onOpenQuiz}
            className="gap-2"
          >
            <ListChecks className="h-4 w-4" />
            퀴즈 풀기
          </Button>
        )}
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 p-6">
        <div className="max-w-3xl mx-auto">
          <ReactMarkdown
            components={{
              h1: ({ children }) => (
                <h1 className="text-3xl font-bold mb-6 text-foreground">{children}</h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground border-b pb-2">{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">{children}</h3>
              ),
              p: ({ children }) => (
                <p className="text-muted-foreground leading-relaxed mb-4">{children}</p>
              ),
              ul: ({ children }) => (
                <ul className="list-disc list-inside space-y-2 mb-4 text-muted-foreground">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal list-inside space-y-2 mb-4 text-muted-foreground">{children}</ol>
              ),
              li: ({ children }) => (
                <li className="leading-relaxed">{children}</li>
              ),
              code: ({ className, children }) => {
                const isBlock = className?.includes('language-');
                if (isBlock) {
                  return (
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto mb-4 text-sm">
                      <code>{children}</code>
                    </pre>
                  );
                }
                return (
                  <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>
                );
              },
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground my-4">
                  {children}
                </blockquote>
              ),
              table: ({ children }) => (
                <div className="overflow-x-auto mb-4">
                  <table className="w-full border-collapse border border-border">{children}</table>
                </div>
              ),
              th: ({ children }) => (
                <th className="border border-border px-4 py-2 bg-muted font-semibold text-left">{children}</th>
              ),
              td: ({ children }) => (
                <td className="border border-border px-4 py-2">{children}</td>
              ),
              hr: () => <Separator className="my-6" />,
              strong: ({ children }) => (
                <strong className="font-semibold text-foreground">{children}</strong>
              ),
            }}
          >
            {topic.content}
          </ReactMarkdown>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          <Button
            variant="outline"
            onClick={onPrev}
            disabled={!hasPrev}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            이전
          </Button>
          
          <div className="flex gap-2">
            {!isCompleted && (
              <Button onClick={onMarkComplete} className="gap-2">
                <CheckCircle2 className="h-4 w-4" />
                학습 완료
              </Button>
            )}
            {isCompleted && topic.quiz && topic.quiz.length > 0 && (
              <Button onClick={onOpenQuiz} variant="secondary" className="gap-2">
                <Award className="h-4 w-4" />
                퀴즈 다시 풀기
              </Button>
            )}
          </div>
          
          <Button
            variant="outline"
            onClick={onNext}
            disabled={!hasNext}
            className="gap-2"
          >
            다음
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// 토픽 목록 사이드바
interface TopicSidebarProps {
  category: LearningCategory;
  topics: LearningTopic[];
  currentTopicSlug: string;
  completedTopics: string[];
  onSelectTopic: (topicSlug: string) => void;
}

export function TopicSidebar({
  category,
  topics,
  currentTopicSlug,
  completedTopics,
  onSelectTopic,
}: TopicSidebarProps) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">{category.name}</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">{category.description}</p>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-400px)]">
          <div className="space-y-1 p-3">
            {topics.map((topic, index) => {
              const isCompleted = completedTopics.includes(topic.slug);
              const isCurrent = topic.slug === currentTopicSlug;
              
              return (
                <button
                  key={topic.id}
                  onClick={() => onSelectTopic(topic.slug)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors",
                    isCurrent 
                      ? "bg-primary/10 text-primary font-medium" 
                      : "hover:bg-muted",
                    isCompleted && !isCurrent && "text-muted-foreground"
                  )}
                >
                  <div className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full border-2 text-xs",
                    isCompleted 
                      ? "bg-green-600 border-green-600 text-white"
                      : isCurrent 
                        ? "border-primary text-primary"
                        : "border-muted-foreground/30 text-muted-foreground"
                  )}>
                    {isCompleted ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span className="flex-1 text-sm">{topic.title}</span>
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
