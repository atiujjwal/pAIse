"use client";

import { useMemo } from "react";
import { useAuthStore } from "@/src/features/auth/store";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/src/components/ui/ThemeToggle";
import { cn } from "@/src/lib/utils";
import NotificationBell from "@/src/components/notifications/NotificationBell";

export function TopNav() {
  const { user, accessToken } = useAuthStore((state) => state);
  const router = useRouter();

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
    <header className="sticky top-0 z-30 flex h-20 items-center justify-end bg-background/80 px-8 backdrop-blur-md transition-colors relative">
      {/* --- Modern Gradient Separator --- */}
      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-border/60 to-transparent" />

      <div className="flex items-center gap-2">
        {/* Theme Switcher */}
        <ThemeToggle />

        {/* Notification Bell */}
        <NotificationBell />

        {/* Divider */}
        <div className="h-8 w-px bg-border/40 mx-2" />

        {/* Profile Section */}
        <button
          onClick={() => router.push("/dashboard/settings")}
          className="group flex items-center gap-3 rounded-xl py-1 pl-2 pr-1 transition-all hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <div className="hidden flex-col items-end md:flex">
            <p className="text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
              {user?.name || "User"}
            </p>
            <p className="text-[10px] text-muted-foreground max-w-[150px] truncate">
              {user?.email || "user@example.com"}
            </p>
          </div>

          <div
            className={cn(
              "relative flex h-10 w-10 items-center justify-center rounded-full border border-border/50 shadow-sm transition-transform group-hover:scale-105",
              "bg-muted overflow-hidden"
            )}
          >
            {avatar ? (
              <img
                src={avatar}
                alt="Profile"
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  e.currentTarget.nextElementSibling?.classList.remove(
                    "hidden"
                  );
                }}
              />
            ) : null}
            {/* Initial Fallback */}
            <span
              className={cn(
                "absolute text-primary font-bold",
                avatar && "hidden"
              )}
            >
              {user?.name?.[0]?.toUpperCase() || "U"}
            </span>
          </div>
        </button>
      </div>
    </header>
  );
}
