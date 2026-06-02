'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Play, 
  X, 
  Gift, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Volume2,
  VolumeX
} from 'lucide-react';
import { useAdContext } from './ad-provider';

interface RewardedAdProps {
  onComplete: () => void;
  onClose?: () => void;
  rewardDescription?: string;
}

type AdState = 'ready' | 'loading' | 'playing' | 'completed' | 'error';

export function RewardedAd({
  onComplete,
  onClose,
  rewardDescription = 'AI 투자 일기 분석',
}: RewardedAdProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [adState, setAdState] = useState<AdState>('ready');
  const [progress, setProgress] = useState(0);
  const [countdown, setCountdown] = useState(5);
  const [isMuted, setIsMuted] = useState(false);
  const { isAdBlockDetected } = useAdContext();

  const adSlot = process.env.NEXT_PUBLIC_ADSENSE_SLOT_REWARDED;

  // Simulate ad playback
  const startAd = useCallback(() => {
    setAdState('loading');
    
    // Simulate loading delay
    setTimeout(() => {
      setAdState('playing');
      setProgress(0);
      setCountdown(5);
    }, 1000);
  }, []);

  // Countdown timer during ad playback
  useEffect(() => {
    if (adState !== 'playing') return;

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 20;
        if (next >= 100) {
          clearInterval(progressInterval);
          setAdState('completed');
          return 100;
        }
        return next;
      });
    }, 1000);

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(countdownInterval);
    };
  }, [adState]);

  const handleComplete = () => {
    setIsOpen(false);
    onComplete();
  };

  const handleClose = () => {
    if (adState !== 'playing') {
      setIsOpen(false);
      onClose?.();
    }
  };

  const handleSkip = () => {
    if (countdown === 0 || adState === 'completed') {
      handleComplete();
    }
  };

  // If ad blocker detected, allow direct access
  if (isAdBlockDetected) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              광고 차단 감지
            </DialogTitle>
            <DialogDescription>
              광고 차단기가 활성화되어 있어 광고를 표시할 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <Card className="mt-4">
            <CardContent className="py-4">
              <p className="text-sm text-muted-foreground text-center">
                바로 {rewardDescription} 기능을 사용할 수 있습니다.
              </p>
            </CardContent>
          </Card>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              취소
            </Button>
            <Button onClick={handleComplete} className="flex-1">
              계속하기
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Missing ad configuration - allow direct access
  if (!adSlot && process.env.NODE_ENV === 'development') {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-primary" />
              개발 모드
            </DialogTitle>
            <DialogDescription>
              보상형 광고 슬롯이 설정되지 않았습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              취소
            </Button>
            <Button onClick={handleComplete} className="flex-1">
              무료로 사용하기
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" />
            무료로 사용하기
          </DialogTitle>
          <DialogDescription>
            짧은 광고를 시청하시면 {rewardDescription} 기능을 무료로 사용할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {adState === 'ready' && (
            <Card className="border-dashed">
              <CardContent className="py-8">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                    <Play className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">광고 시청하기</p>
                    <p className="text-sm text-muted-foreground">
                      약 5초 정도의 짧은 광고입니다
                    </p>
                  </div>
                  <Button onClick={startAd} className="w-full sm:w-auto">
                    <Play className="w-4 h-4 mr-2" />
                    광고 보고 무료로 사용하기
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {adState === 'loading' && (
            <Card>
              <CardContent className="py-8">
                <div className="text-center space-y-4">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                  <p className="text-sm text-muted-foreground">광고 로딩 중...</p>
                </div>
              </CardContent>
            </Card>
          )}

          {adState === 'playing' && (
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                {/* Simulated ad content */}
                <div className="bg-gradient-to-br from-primary/20 to-blue-500/20 aspect-video flex items-center justify-center relative">
                  <div className="text-center">
                    <p className="text-lg font-medium">광고 영역</p>
                    <p className="text-sm text-muted-foreground">
                      실제 광고가 표시됩니다
                    </p>
                  </div>
                  
                  {/* Mute button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 bg-black/20 hover:bg-black/30"
                    onClick={() => setIsMuted(!isMuted)}
                  >
                    {isMuted ? (
                      <VolumeX className="w-4 h-4 text-white" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-white" />
                    )}
                  </Button>
                  
                  {/* Countdown overlay */}
                  <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
                    {countdown > 0 ? `${countdown}초` : '완료'}
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="p-2 bg-muted">
                  <Progress value={progress} className="h-1" />
                </div>
              </CardContent>
            </Card>
          )}

          {adState === 'completed' && (
            <Card className="border-green-500">
              <CardContent className="py-8">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 mx-auto bg-green-500/10 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  </div>
                  <div>
                    <p className="font-medium text-green-600">광고 시청 완료!</p>
                    <p className="text-sm text-muted-foreground">
                      이제 {rewardDescription} 기능을 사용할 수 있습니다
                    </p>
                  </div>
                  <Button onClick={handleComplete} className="w-full sm:w-auto bg-green-500 hover:bg-green-600">
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    {rewardDescription} 시작하기
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Skip/Close button */}
        {(adState === 'playing' || adState === 'completed') && (
          <div className="flex justify-between items-center mt-4">
            <p className="text-xs text-muted-foreground">
              {adState === 'playing' && countdown > 0 
                ? `${countdown}초 후 건너뛸 수 있습니다`
                : adState === 'completed'
                ? '광고 시청이 완료되었습니다'
                : '건너뛰기 가능'}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              disabled={adState === 'playing' && countdown > 0}
            >
              {adState === 'completed' ? '계속하기' : '건너뛰기'}
              {adState === 'playing' && countdown > 0 && ` (${countdown})`}
            </Button>
          </div>
        )}

        {/* Cancel button during ready state */}
        {adState === 'ready' && (
          <Button variant="ghost" onClick={handleClose} className="w-full mt-2">
            <X className="w-4 h-4 mr-2" />
            취소
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Hook to use rewarded ad functionality
export function useRewardedAd() {
  const [showAd, setShowAd] = useState(false);
  const [onRewardComplete, setOnRewardComplete] = useState<(() => void) | null>(null);

  const requestAd = useCallback((callback: () => void) => {
    setOnRewardComplete(() => callback);
    setShowAd(true);
  }, []);

  const handleComplete = useCallback(() => {
    setShowAd(false);
    onRewardComplete?.();
    setOnRewardComplete(null);
  }, [onRewardComplete]);

  const handleClose = useCallback(() => {
    setShowAd(false);
    setOnRewardComplete(null);
  }, []);

  return {
    showAd,
    requestAd,
    handleComplete,
    handleClose,
    RewardedAdComponent: showAd ? (
      <RewardedAd onComplete={handleComplete} onClose={handleClose} />
    ) : null,
  };
}
