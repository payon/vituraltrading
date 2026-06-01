'use client';

import * as React from 'react';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle2, 
  XCircle, 
  ChevronRight, 
  RotateCcw,
  Trophy,
  Lightbulb
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { QuizQuestion } from '@/data/learning-content';

interface QuizModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questions: QuizQuestion[];
  topicTitle: string;
  onComplete: (score: number, totalQuestions: number) => void;
}

export function QuizModal({
  open,
  onOpenChange,
  questions,
  topicTitle,
  onComplete,
}: QuizModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<(number | null)[]>(
    new Array(questions.length).fill(null)
  );
  const [showResult, setShowResult] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);

  const currentQuestion = questions[currentIndex];
  const selectedAnswer = selectedAnswers[currentIndex];
  const isCorrect = selectedAnswer === currentQuestion?.correctAnswer;
  const progressPercentage = ((currentIndex + 1) / questions.length) * 100;

  const handleSelectAnswer = (value: string) => {
    if (showResult) return;
    const newAnswers = [...selectedAnswers];
    newAnswers[currentIndex] = parseInt(value);
    setSelectedAnswers(newAnswers);
  };

  const handleCheckAnswer = () => {
    if (selectedAnswer === null) return;
    setShowResult(true);
    setShowExplanation(true);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowResult(false);
      setShowExplanation(false);
    } else {
      // 퀴즈 완료
      const score = selectedAnswers.reduce((acc, answer, index) => {
        return acc + (answer === questions[index]?.correctAnswer ? 1 : 0);
      }, 0);
      setQuizCompleted(true);
      onComplete(score, questions.length);
    }
  };

  const handleRetry = () => {
    setCurrentIndex(0);
    setSelectedAnswers(new Array(questions.length).fill(null));
    setShowResult(false);
    setShowExplanation(false);
    setQuizCompleted(false);
  };

  const handleClose = () => {
    // 상태 초기화
    setCurrentIndex(0);
    setSelectedAnswers(new Array(questions.length).fill(null));
    setShowResult(false);
    setShowExplanation(false);
    setQuizCompleted(false);
    onOpenChange(false);
  };

  const correctCount = selectedAnswers.reduce((acc, answer, index) => {
    return acc + (answer === questions[index]?.correctAnswer ? 1 : 0);
  }, 0);

  // 퀴즈 완료 화면
  if (quizCompleted) {
    const scorePercentage = Math.round((correctCount / questions.length) * 100);
    const isPassed = scorePercentage >= 60;

    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">퀴즈 완료!</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center py-8">
            <div className={cn(
              "flex h-24 w-24 items-center justify-center rounded-full mb-4",
              isPassed ? "bg-green-100 dark:bg-green-900/30" : "bg-yellow-100 dark:bg-yellow-900/30"
            )}>
              <Trophy className={cn(
                "h-12 w-12",
                isPassed ? "text-green-600" : "text-yellow-600"
              )} />
            </div>
            <div className="text-4xl font-bold mb-2">
              {correctCount} / {questions.length}
            </div>
            <p className="text-muted-foreground mb-4">정답</p>
            <Progress value={scorePercentage} className="w-48 h-3 mb-2" />
            <p className={cn(
              "text-lg font-medium",
              isPassed ? "text-green-600" : "text-yellow-600"
            )}>
              {scorePercentage}% 달성
            </p>
            <Badge variant={isPassed ? "default" : "secondary"} className="mt-2">
              {isPassed ? "합격! 🎉" : "조금 더 학습이 필요해요"}
            </Badge>
          </div>
          <DialogFooter className="flex gap-2 sm:gap-2">
            <Button variant="outline" onClick={handleRetry} className="flex-1">
              <RotateCcw className="mr-2 h-4 w-4" />
              다시 풀기
            </Button>
            <Button onClick={handleClose} className="flex-1">
              완료
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{topicTitle} 퀴즈</DialogTitle>
            <Badge variant="outline">
              {currentIndex + 1} / {questions.length}
            </Badge>
          </div>
          <Progress value={progressPercentage} className="h-2 mt-2" />
        </DialogHeader>

        <div className="py-4">
          <p className="text-lg font-medium mb-4">
            {currentQuestion?.question}
          </p>

          <RadioGroup
            value={selectedAnswer?.toString()}
            onValueChange={handleSelectAnswer}
            className="space-y-3"
          >
            {currentQuestion?.options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrectAnswer = index === currentQuestion.correctAnswer;
              
              let optionStyle = "";
              if (showResult) {
                if (isCorrectAnswer) {
                  optionStyle = "border-green-500 bg-green-50 dark:bg-green-950/30";
                } else if (isSelected && !isCorrectAnswer) {
                  optionStyle = "border-red-500 bg-red-50 dark:bg-red-950/30";
                }
              } else if (isSelected) {
                optionStyle = "border-primary bg-primary/5";
              }

              return (
                <div
                  key={index}
                  className={cn(
                    "flex items-center space-x-3 p-3 rounded-lg border transition-colors cursor-pointer",
                    !showResult && "hover:bg-muted",
                    optionStyle
                  )}
                  onClick={() => !showResult && handleSelectAnswer(index.toString())}
                >
                  <RadioGroupItem value={index.toString()} id={`option-${index}`} disabled={showResult} />
                  <Label 
                    htmlFor={`option-${index}`} 
                    className="flex-1 cursor-pointer flex items-center justify-between"
                  >
                    <span>{option}</span>
                    {showResult && isCorrectAnswer && (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    )}
                    {showResult && isSelected && !isCorrectAnswer && (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                  </Label>
                </div>
              );
            })}
          </RadioGroup>

          {/* 해설 */}
          {showExplanation && showResult && (
            <Card className="mt-4 border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
              <CardContent className="p-4">
                <div className="flex items-start gap-2">
                  <Lightbulb className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-amber-800 dark:text-amber-200 mb-1">해설</p>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      {currentQuestion?.explanation}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          {!showResult ? (
            <Button 
              onClick={handleCheckAnswer} 
              disabled={selectedAnswer === null}
              className="w-full"
            >
              정답 확인
            </Button>
          ) : (
            <Button onClick={handleNext} className="w-full">
              {currentIndex < questions.length - 1 ? (
                <>
                  다음 문제
                  <ChevronRight className="ml-2 h-4 w-4" />
                </>
              ) : (
                <>
                  결과 보기
                  <Trophy className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
