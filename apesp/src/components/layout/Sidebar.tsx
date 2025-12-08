"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Receipt,
  PieChart,
  Settings,
  LogOut,
  Wallet,
} from "lucide-react";
import { useLogout } from "@/src/features/auth/api/auth-queries";
import { cn } from "@/src/lib/utils";
import { Button } from "@/src/components/ui/Button";
import { useNavigationGuard } from "@/src/hooks/use-navigation-guard"; // Import Guard
import { UnsavedChangesDialog } from "@/src/components/common/UnsavedChangesDialog"; // Import Dialog

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
      // Block navigation and show dialog
      setPendingPath(href);
      setShowExitDialog(true);
    } else {
      // Safe to navigate
      router.push(href);
    }
  };

  const confirmNavigation = () => {
    if (pendingPath) {
      setIsDirty(false); // Force unlock
      setShowExitDialog(false);
      router.push(pendingPath);
      setPendingPath(null);
    }
  };

  return (
    <>
      <div className="flex h-full flex-col bg-white/50 backdrop-blur-md border-r border-white/20">
        {/* Brand Header */}
        <div className="flex h-24 items-center px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-purple-400 text-white shadow-glow">
              <Wallet className="h-6 w-6" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-slate-800">
              pAIse
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2 px-4">
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
                  "w-full group flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium transition-all duration-300 ease-in-out",
                  isActive
                    ? "bg-primary text-white shadow-glow translate-x-1"
                    : "text-slate-500 hover:bg-white hover:text-primary hover:shadow-sm"
                )}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 transition-colors",
                    isActive
                      ? "text-white"
                      : "text-slate-400 group-hover:text-primary"
                  )}
                />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-6">
          <Button
            variant="ghost"
            disabled={isPending}
            className="w-full justify-start gap-3 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
            onClick={() => logoutUser()}
          >
            <LogOut className="h-5 w-5" />
            {isPending ? "Logging out..." : "Log Out"}
          </Button>
        </div>
      </div>

      {/* GLOBAL NAVIGATION GUARD DIALOG */}
      <UnsavedChangesDialog
        isOpen={showExitDialog}
        onContinueEditing={() => setShowExitDialog(false)}
        onDiscard={confirmNavigation}
      />
    </>
  );
}
