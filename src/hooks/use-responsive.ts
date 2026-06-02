"use client";

import * as React from "react";

// 브레이크포인트 상수
const MOBILE_BREAKPOINT = 768;
const TABLET_BREAKPOINT = 1024;

// 모바일 여부 확인
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}

// 태블릿 여부 확인
export function useIsTablet() {
  const [isTablet, setIsTablet] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(
      `(min-width: ${MOBILE_BREAKPOINT}px) and (max-width: ${TABLET_BREAKPOINT - 1}px)`
    );
    const onChange = () => {
      setIsTablet(
        window.innerWidth >= MOBILE_BREAKPOINT && window.innerWidth < TABLET_BREAKPOINT
      );
    };
    mql.addEventListener("change", onChange);
    setIsTablet(
      window.innerWidth >= MOBILE_BREAKPOINT && window.innerWidth < TABLET_BREAKPOINT
    );
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isTablet;
}

// 데스크탑 여부 확인
export function useIsDesktop() {
  const [isDesktop, setIsDesktop] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${TABLET_BREAKPOINT}px)`);
    const onChange = () => {
      setIsDesktop(window.innerWidth >= TABLET_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsDesktop(window.innerWidth >= TABLET_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isDesktop;
}

// 통합 반응형 훅
export function useResponsive() {
  const [state, setState] = React.useState({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    width: 0,
    height: 0,
  });

  React.useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      setState({
        isMobile: width < MOBILE_BREAKPOINT,
        isTablet: width >= MOBILE_BREAKPOINT && width < TABLET_BREAKPOINT,
        isDesktop: width >= TABLET_BREAKPOINT,
        width,
        height,
      });
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return state;
}

// 타입 정의
export type Breakpoint = "mobile" | "tablet" | "desktop";

export function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = React.useState<Breakpoint>("desktop");

  React.useEffect(() => {
    const checkBreakpoint = () => {
      const width = window.innerWidth;
      if (width < MOBILE_BREAKPOINT) {
        setBreakpoint("mobile");
      } else if (width < TABLET_BREAKPOINT) {
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
