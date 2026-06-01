"use client";

import * as React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileLayout } from "./mobile-layout";
import { DesktopLayout } from "./desktop-layout";
import { cn } from "@/lib/utils";

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
  /** Force specific layout mode */
  forceMode?: "mobile" | "desktop";
}

export function ResponsiveLayout({
  children,
  title,
  className,
  forceMode,
}: ResponsiveLayoutProps) {
  const isMobile = useIsMobile();

  // Determine which layout to use
  const useMobileLayout = forceMode === "mobile" || (forceMode === undefined && isMobile);

  if (useMobileLayout) {
    return (
      <MobileLayout title={title} className={className}>
        {children}
      </MobileLayout>
    );
  }

  return (
    <DesktopLayout title={title} className={className}>
      {children}
    </DesktopLayout>
  );
}

// Responsive Container - for responsive content without full layout
interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  mobileClassName?: string;
  desktopClassName?: string;
}

export function ResponsiveContainer({
  children,
  className,
  mobileClassName,
  desktopClassName,
}: ResponsiveContainerProps) {
  const isMobile = useIsMobile();

  return (
    <div
      className={cn(
        className,
        isMobile ? mobileClassName : desktopClassName
      )}
    >
      {children}
    </div>
  );
}

// Responsive Grid
interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  cols?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
}

export function ResponsiveGrid({
  children,
  className,
  cols = { mobile: 1, tablet: 2, desktop: 4 },
}: ResponsiveGridProps) {
  const gridCols = cn(
    "grid gap-4",
    cols.mobile && `grid-cols-${cols.mobile}`,
    cols.tablet && `md:grid-cols-${cols.tablet}`,
    cols.desktop && `lg:grid-cols-${cols.desktop}`,
    className
  );

  return <div className={gridCols}>{children}</div>;
}

// Hook for responsive breakpoint
export function useResponsiveBreakpoint() {
  const [breakpoint, setBreakpoint] = React.useState<"mobile" | "tablet" | "desktop">("desktop");

  React.useEffect(() => {
    const checkBreakpoint = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setBreakpoint("mobile");
      } else if (width < 1024) {
        setBreakpoint("tablet");
      } else {
        setBreakpoint("desktop");
      }
    };

    checkBreakpoint();
    window.addEventListener("resize", checkBreakpoint);
    return () => window.removeEventListener("resize", checkBreakpoint);
  }, []);

  return breakpoint;
}
