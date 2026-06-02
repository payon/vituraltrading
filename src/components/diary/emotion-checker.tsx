'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import {
  Flame,
  Skull,
  Sparkles,
  AlertTriangle,
  Shield,
  Plus,
  X,
} from 'lucide-react';

// 감정 타입 정의
export type EmotionType = 'GREED' | 'FEAR' | 'HOPE' | 'ANXIETY' | 'CONFIDENCE';

export interface EmotionData {
  type: EmotionType;
  intensity: number; // 1-10
}

// 감정 설정
const emotionConfig: Record<EmotionType, {
  label: string;
  color: string;
  bgColor: string;
  icon: React.ReactNode;
  description: string;
}> = {
  GREED: {
    label: '욕심',
    color: 'rgb(255, 152, 0)',
    bgColor: 'rgba(255, 152, 0, 0.1)',
    icon: <Flame className="w-5 h-5" />,
    description: '과도한 수익 욕심',
  },
  FEAR: {
    label: '공포',
    color: 'rgb(156, 39, 176)',
    bgColor: 'rgba(156, 39, 176, 0.1)',
    icon: <Skull className="w-5 h-5" />,
    description: '손실에 대한 두려움',
  },
  HOPE: {
    label: '희망',
    color: 'rgb(76, 175, 80)',
    bgColor: 'rgba(76, 175, 80, 0.1)',
    icon: <Sparkles className="w-5 h-5" />,
    description: '긍정적인 기대감',
  },
  ANXIETY: {
    label: '불안',
    color: 'rgb(255, 82, 82)',
    bgColor: 'rgba(255, 82, 82, 0.1)',
    icon: <AlertTriangle className="w-5 h-5" />,
    description: '불확실성에 대한 걱정',
  },
  CONFIDENCE: {
    label: '자신감',
    color: 'rgb(33, 150, 243)',
    bgColor: 'rgba(33, 150, 243, 0.1)',
    icon: <Shield className="w-5 h-5" />,
    description: '투자에 대한 확신',
  },
};

interface EmotionCheckerProps {
  selectedEmotions: EmotionData[];
  onChange: (emotions: EmotionData[]) => void;
}

export function EmotionChecker({ selectedEmotions, onChange }: EmotionCheckerProps) {
  const [showSelector, setShowSelector] = useState(false);

  // 감정 추가
  const addEmotion = (type: EmotionType) => {
    if (!selectedEmotions.find((e) => e.type === type)) {
      onChange([...selectedEmotions, { type, intensity: 5 }]);
    }
    setShowSelector(false);
  };

  // 감정 제거
  const removeEmotion = (type: EmotionType) => {
    onChange(selectedEmotions.filter((e) => e.type !== type));
  };

  // 감정 강도 변경
  const updateIntensity = (type: EmotionType, intensity: number) => {
    onChange(
      selectedEmotions.map((e) =>
        e.type === type ? { ...e, intensity } : e
      )
    );
  };

  // 선택 가능한 감정 목록
  const availableEmotions = (Object.keys(emotionConfig) as EmotionType[]).filter(
    (type) => !selectedEmotions.find((e) => e.type === type)
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          오늘의 감정 상태
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          투자 중 느꼈던 감정을 선택하고 강도를 조절해주세요
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 선택된 감정 목록 */}
        {selectedEmotions.length > 0 ? (
          <div className="space-y-4">
            {selectedEmotions.map((emotion) => {
              const config = emotionConfig[emotion.type];
              return (
                <div
                  key={emotion.type}
                  className="p-3 rounded-lg border"
                  style={{ backgroundColor: config.bgColor, borderColor: config.color }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div style={{ color: config.color }}>{config.icon}</div>
                      <span className="font-medium">{config.label}</span>
                      <Badge variant="secondary" className="text-xs">
                        {config.description}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => removeEmotion(emotion.type)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-3">
                    <Label className="text-sm text-muted-foreground shrink-0">
                      강도
                    </Label>
                    <Slider
                      value={[emotion.intensity]}
                      onValueChange={(value) => updateIntensity(emotion.type, value[0])}
                      min={1}
                      max={10}
                      step={1}
                      className="flex-1"
                      style={{
                        // @ts-expect-error CSS custom property
                        '--slider-track-color': config.color,
                      }}
                    />
                    <span
                      className="font-bold text-sm w-6 text-center"
                      style={{ color: config.color }}
                    >
                      {emotion.intensity}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <p className="text-sm">아직 선택된 감정이 없습니다</p>
            <p className="text-xs mt-1">아래 버튼을 눌러 감정을 추가해주세요</p>
          </div>
        )}

        {/* 감정 추가 버튼 / 선택기 */}
        {showSelector ? (
          <div className="grid grid-cols-2 gap-2">
            {availableEmotions.map((type) => {
              const config = emotionConfig[type];
              return (
                <Button
                  key={type}
                  variant="outline"
                  className="h-auto py-3 justify-start"
                  style={{ borderColor: config.color, color: config.color }}
                  onClick={() => addEmotion(type)}
                >
                  <div className="flex items-center gap-2">
                    {config.icon}
                    <div className="text-left">
                      <div className="font-medium">{config.label}</div>
                      <div className="text-xs opacity-70">{config.description}</div>
                    </div>
                  </div>
                </Button>
              );
            })}
            <Button
              variant="ghost"
              className="col-span-2"
              onClick={() => setShowSelector(false)}
            >
              취소
            </Button>
          </div>
        ) : (
          availableEmotions.length > 0 && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowSelector(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              감정 추가
            </Button>
          )
        )}

        {/* 감정 요약 */}
        {selectedEmotions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2 border-t">
            {selectedEmotions.map((emotion) => {
              const config = emotionConfig[emotion.type];
              return (
                <Badge
                  key={emotion.type}
                  style={{
                    backgroundColor: config.color,
                    color: 'white',
                  }}
                >
                  {config.label} {emotion.intensity}
                </Badge>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export { emotionConfig };
