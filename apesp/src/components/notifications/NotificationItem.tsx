"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/src/lib/utils";
import { Bell } from "lucide-react";

interface NotificationItemProps {
  notification: any;
  onRead: (id: string) => void;
  onClick: (notification: any) => void;
}

export function NotificationItem({
  notification,
  onRead,
  onClick,
}: NotificationItemProps) {
  const itemRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Only set up observer if the notification is unread
    if (notification.is_read) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Trigger read action
            onRead(notification.id);
            // Stop observing once marked
            observer.disconnect();
          }
        });
      },
      {
        root: null, // viewport
        threshold: 0.6, // Trigger when 60% of the item is visible
      }
    );

    if (itemRef.current) {
      observer.observe(itemRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [notification.id, notification.is_read, onRead]);

  return (
    <button
      ref={itemRef}
      onClick={() => onClick(notification)}
      className={cn(
        "w-full text-left px-4 py-3.5 transition-all hover:bg-muted/40 flex gap-3 group relative border-b border-border last:border-0",
        !notification.is_read ? "bg-primary/5 hover:bg-primary/10" : "bg-card"
      )}
    >
      {/* Unread Indicator Dot */}
      {!notification.is_read && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full transition-all duration-300" />
      )}

      <div
        className={cn(
          "mt-1 w-8 h-8 rounded-full flex items-center justify-center shrink-0 border transition-colors",
          !notification.is_read
            ? "bg-primary/10 border-primary/20 text-primary"
            : "bg-muted border-transparent text-muted-foreground"
        )}
      >
        <Bell className="w-4 h-4" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline mb-0.5">
          <p
            className={cn(
              "text-sm truncate pr-2",
              !notification.is_read
                ? "font-bold text-foreground"
                : "font-medium text-foreground/80"
            )}
          >
            {notification.title}
          </p>
          <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">
            {new Date(notification.created_at).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
          {notification.message}
        </p>
      </div>
    </button>
  );
}
