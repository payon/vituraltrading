'use client';

import { useEffect, useRef, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useAdContext } from './ad-provider';

interface AdBannerProps {
  slot?: string;
  format?: 'auto' | 'horizontal' | 'vertical' | 'rectangle';
  responsive?: boolean;
  className?: string;
  fallbackContent?: React.ReactNode;
}

export function AdBanner({
  slot,
  format = 'auto',
  responsive = true,
  className = '',
  fallbackContent,
}: AdBannerProps) {
  const adRef = useRef<HTMLModElement>(null);
  const { isAdBlockDetected, isAdLoaded } = useAdContext();
  const [isReady, setIsReady] = useState(false);

  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
  const adSlot = slot || process.env.NEXT_PUBLIC_ADSENSE_SLOT_BANNER;

  // Calculate initial state based on conditions
  const hasConfig = useMemo(() => {
    return !!(clientId && adSlot);
  }, [clientId, adSlot]);

  // Push ad to AdSense when loaded
  useEffect(() => {
    if (!hasConfig || isAdBlockDetected || !isAdLoaded) {
      return;
    }

    // Try to push ad
    try {
      if (typeof window !== 'undefined') {
        // Push ad to AdSense
        const adsbygoogle = (window as unknown as { adsbygoogle: unknown[] }).adsbygoogle || [];
        adsbygoogle.push({});
        // Use setTimeout to defer state update outside of render/effect cycle
        const timer = setTimeout(() => setIsReady(true), 0);
        return () => clearTimeout(timer);
      }
    } catch {
      // Error handled silently
    }
  }, [hasConfig, isAdBlockDetected, isAdLoaded]);

  // Ad blocker detected
  if (isAdBlockDetected) {
    if (fallbackContent) {
      return <>{fallbackContent}</>;
    }
    
    return (
      <Card className={`border-dashed ${className}`}>
        <CardContent className="flex items-center justify-center py-8 text-muted-foreground">
          <AlertCircle className="w-5 h-5 mr-2" />
          <span className="text-sm">광고가 차단되었습니다</span>
        </CardContent>
      </Card>
    );
  }

  // Missing configuration
  if (!hasConfig) {
    if (process.env.NODE_ENV === 'development') {
      return (
        <Card className={`border-dashed bg-muted/30 ${className}`}>
          <CardContent className="flex items-center justify-center py-8 text-muted-foreground">
            <div className="text-center">
              <AlertCircle className="w-5 h-5 mx-auto mb-2" />
              <span className="text-sm">광고 설정이 필요합니다</span>
              <p className="text-xs mt-1">NEXT_PUBLIC_ADSENSE_CLIENT_ID, NEXT_PUBLIC_ADSENSE_SLOT_BANNER</p>
            </div>
          </CardContent>
        </Card>
      );
    }
    return null;
  }

  // Loading state
  if (!isReady && !isAdLoaded) {
    return (
      <Card className={`animate-pulse ${className}`}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Render ad
  return (
    <div className={`ad-container ${className}`}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={clientId}
        data-ad-slot={adSlot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? 'true' : 'false'}
      />
    </div>
  );
}

// Compact ad banner for mobile
export function AdBannerCompact({ className = '' }: { className?: string }) {
  return (
    <AdBanner
      format="horizontal"
      className={`min-h-[50px] ${className}`}
      fallbackContent={
        <div className={`bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-lg p-4 text-center ${className}`}>
          <p className="text-xs text-muted-foreground">이 공간은 광고 영역입니다</p>
        </div>
      }
    />
  );
}

// Large rectangle ad
export function AdBannerLarge({ className = '' }: { className?: string }) {
  return (
    <AdBanner
      format="rectangle"
      className={`min-h-[250px] ${className}`}
      fallbackContent={
        <div className={`bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-lg p-8 text-center ${className}`}>
          <p className="text-sm text-muted-foreground">광고 공간</p>
          <p className="text-xs text-muted-foreground mt-1">광고 차단기가 활성화되어 있습니다</p>
        </div>
      }
    />
  );
}
