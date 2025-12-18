import { NextRequest } from "next/server";
import { withAuth } from "@/src/middleware/auth";
import { prisma } from "@/src/lib/db";
import { successResponse, errorResponse } from "@/src/lib/response";


const postHandler = async (
  request: NextRequest,
  payload: { userId: string },
  context: { params: { id: string }}
) => {
  try {
    const userId = payload.userId;
    const { id: notificationId } = context.params;
    await prisma.notification.updateMany({
      // updateMany adds extra safety check for user_id
      where: { id: notificationId, user_id: userId },
      data: { is_read: true },
    });
    return successResponse("Marked as read");
  } catch (error) {
    return errorResponse("Internal Server Error", 500);
  }
};

export const POST = withAuth(postHandler);
