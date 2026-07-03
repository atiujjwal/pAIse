"use client";

import Link from "next/link";
import NotificationBell from "@/src/components/notifications/NotificationBell";
import { ThemeToggle } from "@/src/components/ui/ThemeToggle";
import { pAIse_LOGO } from "@/src/lib/mediaUrls";

export function Header() {
  return (
    <header className="relative flex h-16 items-center justify-between bg-background px-4 md:hidden transition-colors z-30">
      {/* --- Modern Gradient Separator --- */}
      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-border/60 to-transparent" />

      {/* Brand logo / title */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary p-0.5">
            <div className="w-full h-full rounded-full bg-background flex items-center justify-center overflow-hidden">
              <img src={pAIse_LOGO} alt="pAIse" className="h-full w-full object-contain" />
            </div>
          </div>
          <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-primary via-purple-500 to-secondary bg-clip-text text-transparent">
            pAIse
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
