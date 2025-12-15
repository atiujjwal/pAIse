import { NextRequest } from "next/server";
import { withAuth } from "@/src/middleware/auth";
import { prisma } from "@/src/lib/db";
import { successResponse } from "@/src/lib/response";

const getHandler = async (req: NextRequest, { userId }: { userId: string }) => {
  // const { searchParams } = new URL(req.url);
  // const limit = parseInt(searchParams.get("limit") || "20");
  // const offset = parseInt(searchParams.get("offset") || "0");

  const notifications = await prisma.notification.findMany({
    where: { user_id: userId },
    orderBy: { created_at: "desc" },
    take: 20,
  });

  const unreadCount = await prisma.notification.count({
    where: { user_id: userId, is_read: false },
  });

  return successResponse("Notifications fetched", {
    notifications,
    unreadCount,
  });
};

const patchHandler = async (
  req: NextRequest,
  { userId }: { userId: string }
) => {
  await prisma.notification.updateMany({
    where: { user_id: userId, is_read: false },
    data: { is_read: true },
  });
  return successResponse("All marked as read");
};

export const GET = withAuth(getHandler);
export const PATCH = withAuth(patchHandler);
