import { prisma } from "@/src/lib/db";

export class NotificationService {
  /**
   * Universal method to trigger a notification
   */
  static async create({
    recipientId,
    type,
    title,
    message,
    data = {},
  }: {
    recipientId: string;
    type:
      | "FRIEND_REQUEST"
      | "EXPENSE_ADDED"
      | "SETTLEMENT_RECORDED"
      | "GROUP_INVITE"; // match Enum
    title: string;
    message: string;
    data?: any;
  }) {
    try {
      await prisma.notification.create({
        data: {
          user_id: recipientId,
          type: type as any, // Cast to Prisma Enum
          title,
          message,
          data,
        },
      });
      // Optional: If you add Socket.io later, emit the event here for real-time updates
    } catch (error) {
      console.error("Failed to create notification", error);
      // We catch error so the main flow (e.g., creating expense) doesn't fail just because notif failed
    }
  }

  static async getUnreadCount(userId: string) {
    return prisma.notification.count({
      where: { user_id: userId, is_read: false },
    });
  }

  static async markAsRead(notificationId: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id: notificationId, user_id: userId },
      data: { is_read: true },
    });
  }

  static async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { user_id: userId, is_read: false },
      data: { is_read: true },
    });
  }
}
