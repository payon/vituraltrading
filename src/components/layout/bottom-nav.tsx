"use client";

import * as React from "react";
import { Home, BookOpen, TrendingUp, PieChart, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  href: string;
}

const navItems: NavItem[] = [
  { id: "home", label: "홈", icon: Home, href: "/" },
  { id: "learn", label: "학습", icon: BookOpen, href: "/learn" },
  { id: "invest", label: "투자", icon: TrendingUp, href: "/invest" },
  { id: "portfolio", label: "포트폴리오", icon: PieChart, href: "/portfolio" },
  { id: "more", label: "더보기", icon: MoreHorizontal, href: "/more" },
];

interface BottomNavProps {
  className?: string;
}

export function BottomNav({ className }: BottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 border-t bg-background",
        "safe-area-bottom",
        className
      )}
    >
      <div className="flex h-16 items-center justify-around px-2">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => router.push(item.href)}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 py-2 transition-colors",
                active
                  ? "text-custom-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon
                className={cn("h-5 w-5", active && "stroke-[2.5px]")}
              />
              <span
                className={cn(
                  "text-xs",
                  active && "font-medium"
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
