"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { LayoutDashboard, Receipt, Users, User } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { useAuthStore } from "@/src/features/auth/store";
import { Avatar, AvatarFallback, AvatarImage } from "@/src/components/ui/Avatar";

const NAV_ITEMS = [
  { label: "Home", href: "/dashboard", icon: LayoutDashboard },
  { label: "Expenses", href: "/dashboard/expenses", icon: Receipt },
  { label: "Groups", href: "/dashboard/groups", icon: Users },
  { label: "Friends", href: "/dashboard/friends", icon: User },
  { label: "Profile", href: "/dashboard/settings", icon: null },
];

export function BottomNav() {
  const pathname = usePathname();
  const { user, accessToken } = useAuthStore((state) => state);

  const getAvatarFromToken = (token: string | null) => {
    if (!token) return null;
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        window
          .atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      const payload = JSON.parse(jsonPayload);
      return payload.avatar || null;
    } catch (e) {
      return null;
    }
  };

  const avatar = useMemo(() => {
    if (user?.avatar) return user.avatar;
    // @ts-ignore
    if (user?.avatar) return user.avatar;
    return getAvatarFromToken(accessToken);
  }, [user, accessToken]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-background/80 border-t border-border/50 shadow-[0_-8px_30px_rgb(0,0,0,0.06)] md:hidden backdrop-blur-xl pb-safe">
      <div className="flex items-center justify-around h-16 px-2">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex h-12 w-16 flex-col items-center justify-center rounded-xl px-2 py-1 transition-colors touch-manipulation",
                isActive ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
              )}
              style={{ minWidth: "44px", minHeight: "44px" }}
            >
              {item.label === "Profile" ? (
                <Avatar
                  className={cn(
                    "h-7 w-7 transition-all border shrink-0",
                    isActive
                      ? "border-primary ring-2 ring-primary/20 scale-105"
                      : "border-border"
                  )}
                >
                  <AvatarImage src={avatar || undefined} className="object-cover" />
                  <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary uppercase">
                    {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
              ) : (
                item.icon && <item.icon className="h-5 w-5" />
              )}
              <span className="text-[10px] font-bold mt-1 tracking-tight">
                {item.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-active-pill"
                  className="absolute -top-px w-6 h-1 rounded-full bg-primary"
                  transition={{ duration: 0.2, ease: "easeOut" }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
