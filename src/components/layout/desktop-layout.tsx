"use client";

import * as React from "react";
import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { cn } from "@/lib/utils";

interface DesktopLayoutProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
}

export function DesktopLayout({
  children,
  title = "대시보드",
  className,
}: DesktopLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

  return (
    <div className={cn("flex h-screen bg-background", className)}>
      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <Header title={title} showMenu={false} />

        {/* Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="container mx-auto p-6">
            {/* Dashboard Grid */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// Dashboard Card Component
interface DashboardCardProps {
  children: React.ReactNode;
  className?: string;
  span?: 1 | 2 | 3 | 4;
}

export function DashboardCard({
  children,
  className,
  span = 1,
}: DashboardCardProps) {
  const spanClasses = {
    1: "col-span-1",
    2: "col-span-1 md:col-span-2",
    3: "col-span-1 md:col-span-2 lg:col-span-3",
    4: "col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-4",
  };

  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-6 shadow-sm transition-shadow hover:shadow-md",
        spanClasses[span],
        className
      )}
    >
      {children}
    </div>
  );
}

// Dashboard Section Component
interface DashboardSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function DashboardSection({
  title,
  children,
  className,
}: DashboardSectionProps) {
  return (
    <section className={cn("space-y-4", className)}>
      <h2 className="text-xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}
