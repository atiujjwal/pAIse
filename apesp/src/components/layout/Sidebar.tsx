"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Receipt,
  PieChart,
  Settings,
  LogOut,
} from "lucide-react";
import { useLogout } from "@/src/features/auth/api/auth-queries";
import { cn } from "@/src/lib/utils";
import { Button } from "@/src/components/ui/Button";
import { useNavigationGuard } from "@/src/hooks/use-navigation-guard";
import { UnsavedChangesDialog } from "@/src/components/common/UnsavedChangesDialog";
import { pAIse_LOGO } from "@/src/lib/mediaUrls";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Expenses", href: "/dashboard/expenses", icon: Receipt },
  { label: "Groups", href: "/dashboard/groups", icon: Users },
  { label: "Friends", href: "/dashboard/friends", icon: Users },
  { label: "Analytics", href: "/dashboard/analytics", icon: PieChart },
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
      <aside className="flex h-full flex-col bg-background border-r border-border shadow-[2px_0_24px_-12px_rgba(0,0,0,0.02)] transition-colors">
        {/* --- Brand Header --- */}
        <div className="flex h-20 items-center px-6">
          <img
            src={pAIse_LOGO}
            alt="pAIse Logo"
            className="h-10 w-auto object-contain"
          />
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
        <div className="p-4 border-t border-border space-y-2">
          <Button
            variant="ghost"
            disabled={isPending}
            className="w-full justify-start gap-3 rounded-xl px-4 py-6 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all group"
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
