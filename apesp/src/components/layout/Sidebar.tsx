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
} from "lucide-react";
import { useAuthStore } from "@/src/features/auth/store";
import { cn } from "@/src/lib/utils";
import { Button } from "../ui/Button";


const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Expenses", href: "/expenses", icon: Receipt },
  { label: "Groups", href: "/groups", icon: Users },
  { label: "Friends", href: "/friends", icon: Users },
  { label: "Analytics", href: "/analytics", icon: PieChart },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const logout = useAuthStore((state) => state.logout);

  return (
    <div className="flex h-full flex-col gap-2 p-4">
      <div className="flex h-12 items-center px-2">
        <span className="text-xl font-bold tracking-tight text-primary">
          pAIse
        </span>
      </div>

      <nav className="flex-1 space-y-1 py-4">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t pt-4">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
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
