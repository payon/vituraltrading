"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface NavigationProps {
  children?: React.ReactNode;
  className?: string;
}

export function Navigation({ children, className }: NavigationProps) {
  return (
    <nav className={cn("flex items-center gap-4", className)}>
      {children}
    </nav>
  );
}

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  active?: boolean;
  className?: string;
}

export function NavLink({
  href,
  children,
  active,
  className,
}: NavLinkProps) {
  return (
    <a
      href={href}
      className={cn(
        "text-sm font-medium transition-colors hover:text-primary",
        active
          ? "text-custom-primary"
          : "text-muted-foreground",
        className
      )}
    >
      {children}
    </a>
  );
}
