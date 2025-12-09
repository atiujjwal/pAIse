"use client";

import { useAuthStore } from "@/src/features/auth/store";
import { Bell } from "lucide-react";
import { Button } from "../ui/Button";

export function Header() {
  const user = useAuthStore((state) => state.user);

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-6">
      <div className="flex items-center gap-4">
        {/* Mobile menu trigger would go here */}
        <h1 className="text-lg font-semibold md:hidden">pAIse</h1>
      </div>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {/* Notification Dot */}
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
        </Button>

        <div className="flex items-center gap-2 border-l pl-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium">{user?.name}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
          <div className="h-9 w-9 overflow-hidden rounded-full bg-primary/20">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="Avatar" />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-bold text-primary">
                {user?.name?.[0]}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
