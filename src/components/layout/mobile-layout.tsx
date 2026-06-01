"use client";

import * as React from "react";
import { Header } from "./header";
import { BottomNav } from "./bottom-nav";
import { cn } from "@/lib/utils";

interface MobileLayoutProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
  hideBottomNav?: boolean;
}

export function MobileLayout({
  children,
  title,
  className,
  hideBottomNav = false,
}: MobileLayoutProps) {
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [startY, setStartY] = React.useState(0);
  const [pullDistance, setPullDistance] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Pull to Refresh
  const handleTouchStart = (e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0) {
      setStartY(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startY > 0 && containerRef.current?.scrollTop === 0) {
      const currentY = e.touches[0].clientY;
      const distance = Math.min(currentY - startY, 80);
      setPullDistance(distance > 0 ? distance : 0);
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance > 60 && !isRefreshing) {
      setIsRefreshing(true);
      // Simulate refresh
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setIsRefreshing(false);
    }
    setPullDistance(0);
    setStartY(0);
  };

  return (
    <div
      className={cn(
        "flex h-screen flex-col bg-background",
        "max-w-screen-mobile mx-auto", // 모바일 최대 너비
        className
      )}
    >
      {/* Header */}
      <Header title={title} />

      {/* Pull to Refresh Indicator */}
      {(pullDistance > 0 || isRefreshing) && (
        <div
          className="absolute left-0 right-0 top-14 flex items-center justify-center bg-background/80 backdrop-blur-sm transition-transform z-40"
          style={{
            height: Math.min(pullDistance, 60),
            transform: `translateY(${Math.min(pullDistance, 60)}px)`,
          }}
        >
          <div
            className={cn(
              "h-6 w-6 rounded-full border-2 border-custom-primary border-t-transparent",
              isRefreshing && "pull-refresh-spinner"
            )}
          />
        </div>
      )}

      {/* Content */}
      <main
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={cn(
          "flex-1 overflow-y-auto overflow-x-hidden",
          !hideBottomNav && "pb-16" // 하단 네비게이션 공간 확보
        )}
      >
        {children}
      </main>

      {/* Bottom Navigation */}
      {!hideBottomNav && <BottomNav />}
    </div>
  );
}
