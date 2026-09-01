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
    <header className="sticky top-0 z-30 flex h-24 items-center justify-end bg-background/95 px-8 backdrop-blur-xl transition-colors duration-200">
      <div className="absolute bottom-0 left-0 h-px w-full bg-border" />

      <div className="flex items-center gap-3">
        {/* Theme Switcher */}
        <div className="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-muted/50 transition-colors">
          <ThemeToggle />
        </div>

        {/* Notification Bell */}
        <div className="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-muted/50 transition-colors">
          <NotificationBell />
        </div>

        {/* Divider */}
        <div className="h-8 w-px bg-gradient-to-b from-transparent via-border to-transparent mx-2" />

        {/* Profile Section */}
        <button
          onClick={() => router.push("/dashboard/settings")}
          className="group flex items-center gap-3 rounded-2xl py-1.5 pl-3 pr-1.5 transition-all hover:bg-muted/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <div className="hidden flex-col items-end md:flex">
            <p className="text-sm font-bold text-foreground tracking-tight transition-colors group-hover:text-primary">
              {user?.name || "User"}
            </p>
            <p className="text-[11px] font-medium text-muted-foreground max-w-[150px] truncate">
              {user?.email || "user@example.com"}
            </p>
          </div>

          {/* Avatar Container with Gradient Ring */}
          <div className="relative h-11 w-11 rounded-xl border border-primary/20 bg-primary-soft p-0.5 shadow-sm transition-colors group-hover:border-primary/40">
            <div
              className={cn(
                "relative flex h-full w-full items-center justify-center rounded-full bg-background overflow-hidden",
                !avatar && "bg-muted"
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
                  "absolute text-primary font-bold text-sm",
                  avatar && "hidden"
                )}
              >
                {user?.name?.[0]?.toUpperCase() || "U"}
              </span>
            </div>
          </div>
        </button>
      </div>
    </header>
  );
}
