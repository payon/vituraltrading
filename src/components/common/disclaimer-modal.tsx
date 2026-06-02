'use client';

import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertTriangle, Info, ShieldCheck } from 'lucide-react';

interface DisclaimerModalProps {
  onAgree?: () => void;
}

// 로컬 스토리지 구독을 위한 함수
function subscribe(callback: () => void) {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

function getSnapshot(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('disclaimer_agreed');
}

function getServerSnapshot(): null {
  return null;
}

export function DisclaimerModal({ onAgree }: DisclaimerModalProps) {
  const [open, setOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const agreed = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // 동의하지 않은 경우 모달 열기
  useEffect(() => {
    if (agreed === null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpen(true);
    }
  }, [agreed]);

  const handleAgree = useCallback(() => {
    if (dontShowAgain) {
      localStorage.setItem('disclaimer_agreed', 'true');
    }
    setOpen(false);
    onAgree?.();
  }, [dontShowAgain, onAgree]);

  const handleDontShowAgainChange = useCallback((checked: boolean | 'indeterminate') => {
    setDontShowAgain(checked === true);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            중요 면책 고지
          </DialogTitle>
          <DialogDescription className="sr-only">
            투자 학습 및 모의투자 앱 이용 전 필수 확인 사항
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* 주의사항 */}
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/50">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-2 text-sm text-amber-800 dark:text-amber-200">
                <p className="font-medium">본 서비스는 투자 권유가 아닙니다.</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>모든 정보는 학습 및 참고 목적으로만 제공됩니다.</li>
                  <li>모의투자는 실제 자금이 아닌 가상 자금을 사용합니다.</li>
                  <li>실제 투자의 손익과는 무관합니다.</li>
                  <li>투자 결정은 본인의 판단과 책임 하에 이루어져야 합니다.</li>
                </ul>
              </div>
            </div>
          </div>
          
          {/* 위험 고지 */}
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/50">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-2 text-sm text-red-800 dark:text-red-200">
                <p className="font-medium">투자 위험성 안내</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>모든 투자에는 원금 손실의 위험이 있습니다.</li>
                  <li>과거의 수익률이 미래의 수익을 보장하지 않습니다.</li>
                  <li>금융 상품 가입 전 설명서를 반드시 확인하세요.</li>
                  <li>본인의 투자 성향과 상황에 맞는 투자를 하세요.</li>
                </ul>
              </div>
            </div>
          </div>
          
          {/* 데이터 보안 */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/50">
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                <p className="font-medium">데이터 보안 안내</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>모의투자 데이터는 암호화되어 저장됩니다.</li>
                  <li>실제 자금 정보는 저장되지 않습니다.</li>
                  <li>API 키는 사용자의 브라우저에만 저장됩니다.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter className="flex-col gap-3 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2">
            <Checkbox 
              id="dont-show-again" 
              checked={dontShowAgain}
              onCheckedChange={handleDontShowAgainChange}
            />
            <label 
              htmlFor="dont-show-again" 
              className="text-sm text-muted-foreground cursor-pointer"
            >
              다시 보지 않기
            </label>
          </div>
          <Button onClick={handleAgree} className="w-full sm:w-auto">
            확인했습니다
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default DisclaimerModal;
