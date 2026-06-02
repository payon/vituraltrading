'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle, ChevronRight, BookOpen } from 'lucide-react';
import { learningCategories, getTopicCountByCategory, type LearningCategory } from '@/data/learning-content';
import { cn } from '@/lib/utils';

interface TopicProgress {
  topicSlug: string;
  completed: boolean;
}

interface CategoryProgress {
  categorySlug: string;
  topics: TopicProgress[];
}

interface LearningCardProps {
  category: LearningCategory;
  progress?: CategoryProgress;
  onSelect: (categorySlug: string) => void;
}

export function LearningCard({ category, progress, onSelect }: LearningCardProps) {
  const totalTopics = getTopicCountByCategory(category.slug);
  const completedTopics = progress?.topics.filter(t => t.completed).length ?? 0;
  const progressPercentage = totalTopics > 0 ? (completedTopics / totalTopics) * 100 : 0;
  const isCompleted = completedTopics === totalTopics && totalTopics > 0;

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-primary/50",
        isCompleted && "border-green-500/50 bg-green-50/50 dark:bg-green-950/20"
      )}
      onClick={() => onSelect(category.slug)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg",
              isCompleted 
                ? "bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400"
                : "bg-primary/10 text-primary"
            )}>
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">{category.name}</CardTitle>
              <CardDescription className="text-sm">{category.description}</CardDescription>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">진행률</span>
          <span className="font-medium">{completedTopics}/{totalTopics} 완료</span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
        <div className="flex items-center justify-between">
          <Badge variant={isCompleted ? "default" : "secondary"} className={cn(
            isCompleted && "bg-green-600 hover:bg-green-700"
          )}>
            {isCompleted ? (
              <>
                <CheckCircle2 className="mr-1 h-3 w-3" />
                완료
              </>
            ) : (
              <>
                <Circle className="mr-1 h-3 w-3" />
                진행중
              </>
            )}
          </Badge>
          <Button variant="ghost" size="sm" className="text-primary">
            {isCompleted ? '복습하기' : '학습하기'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface LearningCardListProps {
  progressData?: CategoryProgress[];
  onSelectCategory: (categorySlug: string) => void;
}

export function LearningCardList({ progressData, onSelectCategory }: LearningCardListProps) {
  const categories = learningCategories;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
      {categories.map(category => (
        <LearningCard
          key={category.id}
          category={category}
          progress={progressData?.find(p => p.categorySlug === category.slug)}
          onSelect={onSelectCategory}
        />
      ))}
    </div>
  );
}
