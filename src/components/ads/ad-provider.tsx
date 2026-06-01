'use client';

import { useEffect, useState, createContext, useContext, useCallback } from 'react';

interface AdContextType {
  isAdBlockDetected: boolean;
  isAdLoaded: boolean;
  showRewardedAd: () => Promise<boolean>;
}

const AdContext = createContext<AdContextType>({
  isAdBlockDetected: false,
  isAdLoaded: false,
  showRewardedAd: async () => false,
});

export function useAdContext() {
  return useContext(AdContext);
}

interface AdProviderProps {
  children: React.ReactNode;
  clientId?: string;
}

export function AdProvider({ children, clientId }: AdProviderProps) {
  const [isAdBlockDetected, setIsAdBlockDetected] = useState(false);
  const [isAdLoaded, setIsAdLoaded] = useState(false);

  useEffect(() => {
    // Check for ad blocker
    const detectAdBlock = async () => {
      try {
        // Try to fetch a fake ad script to detect ad blocker
        const response = await fetch('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js', {
          method: 'HEAD',
          mode: 'no-cors',
        });
        
        // If we can reach Google AdSense, no ad blocker
        setIsAdBlockDetected(false);
      } catch {
        // If fetch fails, likely ad blocker is active
        setIsAdBlockDetected(true);
      }
    };

    detectAdBlock();

    // Load AdSense script
    if (clientId && typeof window !== 'undefined') {
      const script = document.createElement('script');
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`;
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.onload = () => setIsAdLoaded(true);
      script.onerror = () => setIsAdBlockDetected(true);
      document.head.appendChild(script);
    }
  }, [clientId]);

  const showRewardedAd = useCallback(async (): Promise<boolean> => {
    // This would integrate with actual rewarded ad implementation
    // For now, we simulate a rewarded ad experience
    return new Promise((resolve) => {
      // In a real implementation, this would show an actual rewarded ad
      // and resolve based on the user completing the ad
      const rewardedAdAvailable = typeof window !== 'undefined' && !isAdBlockDetected;
      
      if (rewardedAdAvailable) {
        // Simulate ad viewing time
        setTimeout(() => {
          resolve(true);
        }, 100);
      } else {
        resolve(false);
      }
    });
  }, [isAdBlockDetected]);

  return (
    <AdContext.Provider value={{ isAdBlockDetected, isAdLoaded, showRewardedAd }}>
      {children}
    </AdContext.Provider>
  );
}
