"use client";

import { useAuthStore } from "@/src/features/auth/store";
import { Bell } from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/src/components/ui/Avatar";

export function Header() {
  const user = useAuthStore((state) => state.user);

  return (
    <header className="relative flex h-16 items-center justify-between bg-background px-6 transition-colors">
      {/* --- Modern Gradient Separator --- */}
      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-border/60 to-transparent" />

      <div className="flex items-center gap-4">
        {/* Mobile menu trigger would go here */}
        <h1 className="text-lg font-bold text-foreground md:hidden">pAIse</h1>
      </div>

      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="relative text-muted-foreground hover:text-foreground"
        >
          <Bell className="h-5 w-5" />
          {/* Notification Dot */}
          <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-destructive ring-2 ring-background" />
        </Button>

        <div className="flex items-center gap-3 border-l border-border/40 pl-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-foreground">{user?.name}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>

          <Avatar className="h-9 w-9 border border-border/50">
            <AvatarImage src={user?.avatar || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold">
              {user?.name?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
