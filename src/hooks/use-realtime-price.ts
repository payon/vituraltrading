'use client';

import { useEffect, useRef, useCallback } from 'react';

interface UseRealtimePriceOptions {
  interval?: number; // ms
  onUpdate?: () => void;
  enabled?: boolean;
}

export function useRealtimePrice({
  interval = 5000, // 5초마다 업데이트
  onUpdate,
  enabled = true,
}: UseRealtimePriceOptions = {}) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const onUpdateRef = useRef(onUpdate);

  // 최신 콜백 유지
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  const startPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    intervalRef.current = setInterval(() => {
      onUpdateRef.current?.();
    }, interval);
  }, [interval]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      startPolling();
    } else {
      stopPolling();
    }

    return () => {
      stopPolling();
    };
  }, [enabled, startPolling, stopPolling]);

  return { startPolling, stopPolling };
}
