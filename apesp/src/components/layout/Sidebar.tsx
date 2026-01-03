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
      <aside className="relative flex h-full flex-col bg-background/80 backdrop-blur-xl transition-colors">
        {/* --- Gradient Vertical Separator --- */}
        <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-border/60 to-transparent" />

        {/* --- Brand Header --- */}
        <div className="relative flex h-24 items-center px-6">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary p-0.5 group-hover:scale-105 transition-transform duration-300 shadow-lg shadow-primary/20">
              <div className="h-full w-full rounded-[10px] bg-background flex items-center justify-center overflow-hidden">
                <img
                  src={pAIse_LOGO}
                  alt="pAIse"
                  className="h-full w-full object-contain"
                />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-primary via-purple-500 to-secondary bg-clip-text text-transparent group-hover:opacity-80 transition-opacity">
                pAIse
              </span>
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest -mt-1">
              </span>
            </div>
          </Link>
        </div>

        {/* --- Navigation --- */}
        <nav className="flex-1 space-y-2 px-4 py-6 overflow-y-auto custom-scrollbar">
          <p className="px-4 text-[11px] font-bold text-muted-foreground/70 uppercase tracking-wider mb-3">
            Main Menu
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
                  "relative w-full group flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium transition-all duration-300 ease-out outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
                  isActive
                    ? "bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/25"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                )}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 transition-transform duration-300",
                    isActive
                      ? "text-white"
                      : "text-muted-foreground group-hover:text-primary group-hover:scale-110"
                  )}
                />
                <span className="flex-1 text-left tracking-tight">
                  {item.label}
                </span>

                {/* Active Indicator Glow */}
                {isActive && (
                  <div className="absolute inset-0 rounded-xl ring-1 ring-white/20" />
                )}
              </button>
            );
          })}
        </nav>

        {/* --- Footer / Logout --- */}
        <div className="p-4 mt-auto">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent mb-4" />

          <Button
            variant="ghost"
            disabled={isPending}
            className="w-full justify-start gap-3 rounded-xl px-3 py-6 h-auto text-muted-foreground hover:bg-destructive/5 hover:text-destructive transition-all group border border-transparent hover:border-destructive/10"
            onClick={() => logoutUser()}
          >
            <div className="p-2 rounded-lg bg-muted group-hover:bg-destructive/10 transition-colors">
              <LogOut className="h-4 w-4 text-muted-foreground group-hover:text-destructive" />
            </div>
            <div className="flex flex-col items-start">
              <span className="font-semibold text-sm">
                {isPending ? "Logging out..." : "Log Out"}
              </span>
              <span className="text-[10px] text-muted-foreground/60 group-hover:text-destructive/60">
                End your session
              </span>
            </div>
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
