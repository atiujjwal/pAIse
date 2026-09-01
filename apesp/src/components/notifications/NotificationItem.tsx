import {
  UserPlus,
  UserCheck,
  Receipt,
  Clock,
  Bell,
  Circle,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { formatDistanceToNow } from "date-fns";
interface Notification {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  type: string;
  data?: { url?: string };
}

interface NotificationItemProps {
  notification: Notification;
  onRead: (id: string) => void;
  onClick: (notification: Notification) => void;
}

const getNotificationConfig = (type: string) => {
  switch (type) {
    case "FRIEND_REQUEST":
      return {
        icon: UserPlus,
        colorClass: "text-blue-500 bg-blue-500/10",
      };
    case "FRIEND_ACCEPTED":
      return {
        icon: UserCheck,
        colorClass: "text-emerald-500 bg-emerald-500/10",
      };
    case "EXPENSE_ADDED":
      return {
        icon: Receipt,
        colorClass: "text-orange-500 bg-orange-500/10",
      };
    case "REMINDER":
      return {
        icon: Clock,
        colorClass: "text-primary bg-primary-soft",
      };
    default:
      return {
        icon: Bell,
        colorClass: "text-muted-foreground bg-muted",
      };
  }
};

export function NotificationItem({
  notification,
  onRead,
  onClick,
}: NotificationItemProps) {
  const config = getNotificationConfig(notification.type);
  const Icon = config.icon;

  const timeAgo = new Date(notification.created_at).toLocaleDateString(
    undefined,
    {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );

  return (
    <div
      onClick={() => onClick(notification)}
      className={cn(
        "relative flex w-full cursor-pointer items-start gap-3 p-4 transition-colors hover:bg-muted/50 border-b border-border/50 last:border-0",
        !notification.is_read && "bg-muted/30"
      )}
    >
      {/* Icon Section */}
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full mt-0.5",
          config.colorClass
        )}
      >
        <Icon className="h-4 w-4" />
      </div>

      {/* Content Section - with Text Wrapping */}
      <div className="flex-1 space-y-1 min-w-0">
        {" "}
        {/* min-w-0 is crucial for flex text wrap */}
        <div className="flex items-center justify-between gap-2">
          <p
            className={cn(
              "text-sm font-medium leading-none text-foreground break-words", // break-words handles long names
              !notification.is_read && "font-bold"
            )}
          >
            {notification.title}
          </p>
          <span className="shrink-0 text-[10px] text-muted-foreground">
            {timeAgo}
          </span>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-3 break-words whitespace-normal leading-relaxed">
          {notification.message}
        </p>
      </div>

      {/* Unread Indicator */}
      {!notification.is_read && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex h-full items-center">
          <div className="h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
        </div>
      )}
    </div>
  );
}
