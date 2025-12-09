"use client";

import { useMemo } from "react";
import { useAuthStore } from "@/src/features/auth/store";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import { cn } from "@/src/lib/utils";

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
      return payload.avatarUrl || payload.avatar_url || payload.picture || null;
    } catch (e) {
      return null;
    }
  };

  const avatarUrl = useMemo(() => {
    if (user?.avatar_url) return user.avatar_url;
    // @ts-ignore: Handle potential schema mismatch
    if (user?.avatar) return user.avatar;

    return getAvatarFromToken(accessToken);
  }, [user, accessToken]);

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-end border-b border-slate-100 bg-white/80 px-8 backdrop-blur-md">
      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <Button
          variant="ghost"
          size="icon"
          className="relative text-slate-400 hover:bg-slate-50 hover:text-primary transition-colors"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        </Button>

        {/* Divider */}
        <div className="h-8 w-px bg-slate-100" />

        {/* Profile Section */}
        <button
          onClick={() => router.push("/dashboard/settings")}
          className="group flex items-center gap-3 rounded-xl py-1 pl-3 pr-1 transition-all hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <div className="hidden flex-col items-end md:flex">
            <p className="text-sm font-semibold text-slate-700 transition-colors group-hover:text-primary">
              {user?.name || "User"}
            </p>
            <p className="text-[10px] text-slate-400 max-w-[150px] truncate">
              {user?.email || "user@example.com"}
            </p>
          </div>

          <div
            className={cn(
              "relative flex h-10 w-10 items-center justify-center rounded-full border-2 border-white shadow-sm transition-transform group-hover:scale-105",
              "bg-gradient-to-tr from-purple-100 to-primary/10 text-primary font-bold overflow-hidden"
            )}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
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
            {/* Initial Fallback (Visible if no URL or if Image Errors) */}
            <span className={cn("absolute", avatarUrl && "hidden")}>
              {user?.name?.[0]?.toUpperCase() || "U"}
            </span>
          </div>
        </button>
      </div>
    </header>
  );
}
