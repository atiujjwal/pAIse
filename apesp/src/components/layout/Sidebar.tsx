"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Receipt,
  Settings,
  LogOut,
} from "lucide-react";
import { useLogout } from "@/src/features/auth/api/auth-queries";
import { cn } from "@/src/lib/utils";
import { Button } from "@/src/components/ui/Button";
import { useNavigationGuard } from "@/src/hooks/use-navigation-guard";
import { UnsavedChangesDialog } from "@/src/components/common/UnsavedChangesDialog";
import { pAIse_LOGO } from "@/src/lib/mediaUrls";
import Link from "next/link";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Expenses", href: "/dashboard/expenses", icon: Receipt },
  { label: "Groups", href: "/dashboard/groups", icon: Users },
  { label: "Friends", href: "/dashboard/friends", icon: Users },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { mutate: logoutUser, isPending } = useLogout();

  // --- Navigation Guard Logic ---
  const isDirty = useNavigationGuard((state) => state.isDirty);
  const setIsDirty = useNavigationGuard((state) => state.setIsDirty);

  const [showExitDialog, setShowExitDialog] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);

  const handleNavigation = (href: string) => {
    if (pathname === href) return;

    if (isDirty) {
      setPendingPath(href);
      setShowExitDialog(true);
    } else {
      router.push(href);
    }
  };

  const confirmNavigation = () => {
    if (pendingPath) {
      setIsDirty(false);
      setShowExitDialog(false);
      router.push(pendingPath);
      setPendingPath(null);
    }
  };

  return (
    <>
      <aside className="relative flex h-full flex-col bg-background/95 backdrop-blur-sm transition-colors">
        {/* --- Modern Vertical Separator (Corrected Fade) --- */}
        {/* Changed 'h-full top-0' to 'top-10 bottom-10' to force a visible fade at corners */}
        <div className="absolute right-0 top-10 bottom-10 w-[1px] bg-gradient-to-b from-transparent via-border/40 to-transparent" />

        {/* --- Brand Header --- */}
        <div className="relative flex h-20 items-center px-6">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 shadow-sm transition-transform group-hover:scale-105">
              <img
                src={pAIse_LOGO}
                alt="pAIse"
                className="h-6 w-auto object-contain"
              />
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-foreground group-hover:text-primary transition-colors">
              pAIse
            </span>
          </Link>

          {/* Header Separator */}
          <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-border/40 to-transparent" />
        </div>

        {/* --- Navigation --- */}
        <nav className="flex-1 space-y-1.5 px-4 py-6 overflow-y-auto custom-scrollbar">
          <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Menu
          </p>
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);

            return (
              <button
                key={item.href}
                onClick={() => handleNavigation(item.href)}
                className={cn(
                  "relative w-full group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ease-in-out outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 transition-colors duration-200",
                    isActive
                      ? "text-primary-foreground"
                      : "text-muted-foreground group-hover:text-primary"
                  )}
                />
                <span className="flex-1 text-left">{item.label}</span>

                {/* Active Indicator Dot */}
                {isActive && (
                  <span className="absolute right-3 w-1.5 h-1.5 rounded-full bg-primary-foreground/30 animate-pulse" />
                )}
              </button>
            );
          })}
        </nav>

        {/* --- Footer / Logout --- */}
        <div className="relative p-4 space-y-2">
          {/* Footer Separator */}
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-border/40 to-transparent" />

          <Button
            variant="ghost"
            disabled={isPending}
            className="w-full !justify-start gap-3 rounded-xl px-2 py-6 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all group"
            onClick={() => logoutUser()}
          >
            <div className="p-1.5 rounded-lg bg-muted group-hover:bg-destructive/20 transition-colors">
              <LogOut className="h-4 w-4 text-muted-foreground group-hover:text-destructive" />
            </div>
            <span className="font-medium">
              {isPending ? "Logging out..." : "Log Out"}
            </span>
          </Button>
        </div>
      </aside>

      {/* --- GUARD DIALOG --- */}
      <UnsavedChangesDialog
        isOpen={showExitDialog}
        onContinueEditing={() => setShowExitDialog(false)}
        onDiscard={confirmNavigation}
      />
    </>
  );
}
