"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Receipt,
  PieChart,
  Settings,
  LogOut,
  Wallet,
} from "lucide-react";
import { useAuthStore } from "@/src/features/auth/store";
import { cn } from "@/src/lib/utils";
import { Button } from "@/src/components/ui/Button";

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
  const logout = useAuthStore((state) => state.logout);

  return (
    <div className="flex h-full flex-col bg-card border-r">
      {/* Brand Header */}
      <div className="flex h-20 items-center px-6 border-b">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Wallet className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            pAIse
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        <p className="px-4 text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
          Menu
        </p>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 transition-colors",
                  isActive
                    ? "text-primary-foreground"
                    : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer Actions */}
      <div className="p-4 border-t bg-muted/20">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          onClick={() => {
            logout();
            window.location.href = "/auth/login";
          }}
        >
          <LogOut className="h-4 w-4" />
          Log Out
        </Button>
      </div>
    </div>
  );
}
