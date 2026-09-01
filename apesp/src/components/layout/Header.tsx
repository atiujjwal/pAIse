"use client";

import Link from "next/link";
import NotificationBell from "@/src/components/notifications/NotificationBell";
import { ThemeToggle } from "@/src/components/ui/ThemeToggle";
import { BrandLogo } from "@/src/components/common/BrandLogo";

export function Header() {
  return (
    <header className="relative z-30 flex h-16 items-center justify-between bg-card px-4 transition-colors md:hidden">
      <div className="absolute bottom-0 left-0 h-px w-full bg-border" />

      {/* Brand logo / title */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl border border-border bg-secondary p-1 dark:bg-brand-red-s80">
            <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-lg">
              <BrandLogo />
            </div>
          </div>
          <span className="font-display text-xl font-semibold tracking-tight text-foreground">
            p<span className="text-primary">AI</span>se
          </span>
        </Link>
      </div>

      {/* Quick Actions (Theme Switch + Notifications) */}
      <div className="flex items-center gap-2.5">
        <ThemeToggle />
        <NotificationBell />
      </div>
    </header>
  );
}
