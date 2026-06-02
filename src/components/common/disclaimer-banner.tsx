'use client';

import { useState } from 'react';
import { AlertTriangle, X, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DisclaimerBannerProps {
  className?: string;
}

export function DisclaimerBanner({ className }: DisclaimerBannerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div 
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 bg-amber-50 dark:bg-amber-950/90 border-t border-amber-200 dark:border-amber-800',
        'transition-all duration-300',
        className
      )}
    >
      {/* 축소 상태 - 한 줄 표시 */}
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <p className="text-xs sm:text-sm font-medium truncate">
              ⚠️ 본 서비스는 투자 권유가 아니며, 모의투자는 실제 손익과 무관합니다.
            </p>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-amber-700 hover:text-amber-900 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-900"
              onClick={() => setIsExpanded(!isExpanded)}
              aria-label={isExpanded ? '접기' : '펼치기'}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-amber-700 hover:text-amber-900 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-900"
              onClick={() => setIsVisible(false)}
              aria-label="닫기"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* 확장 상태 - 상세 내용 */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-amber-200 dark:border-amber-800">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-amber-700 dark:text-amber-300">
              <div className="space-y-1">
                <p className="font-medium">📋 학습 목적</p>
                <p className="text-amber-600 dark:text-amber-400">
                  모든 정보는 학습 및 참고 목적으로만 제공됩니다.
                </p>
              </div>
              
              <div className="space-y-1">
                <p className="font-medium">💰 모의투자</p>
                <p className="text-amber-600 dark:text-amber-400">
                  가상 자금을 사용하며 실제 자금 거래가 아닙니다.
                </p>
              </div>
              
              <div className="space-y-1">
                <p className="font-medium">⚠️ 투자 위험</p>
                <p className="text-amber-600 dark:text-amber-400">
                  실제 투자는 원금 손실의 위험이 있습니다. 신중히 결정하세요.
                </p>
              </div>
            </div>
            
            <div className="mt-3 pt-3 border-t border-amber-200 dark:border-amber-800 flex items-center justify-center gap-4 text-xs text-amber-600 dark:text-amber-400">
              <span>투자 결정은 본인의 판단과 책임</span>
              <span>•</span>
              <span>과거 수익률 ≠ 미래 보장</span>
              <span>•</span>
              <span>금융상품 설명서 필수 확인</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 인라인 면책 고지 (페이지 내부에 표시)
 */
export function DisclaimerInline({ className }: DisclaimerBannerProps) {
  return (
    <div 
      className={cn(
        'rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 p-4',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div className="space-y-2">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
            면책 고지
          </p>
          <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-1">
            <li>• 본 서비스는 투자 권유가 아닌 학습 목적의 모의투자 시스템입니다.</li>
            <li>• 모의투자는 실제 자금이 아닌 가상 자금을 사용합니다.</li>
            <li>• 실제 투자의 손익과는 무관하며, 모든 투자 결정은 본인의 책임입니다.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

/**
 * 간단한 텍스트 면책 고지
 */
export function DisclaimerText({ className }: DisclaimerBannerProps) {
  return (
    <p 
      className={cn(
        'text-xs text-muted-foreground text-center',
        className
      )}
    >
      * 본 서비스는 투자 권유가 아니며, 모의투자는 실제 손익과 무관합니다.
    </p>
  );
}

export default DisclaimerBanner;
