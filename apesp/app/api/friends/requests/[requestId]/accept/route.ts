import { NextRequest } from "next/server";
import { FriendshipStatus, NotificationType } from "@prisma/client";
import { prisma } from "@/src/lib/db";
import { formatFriendshipResponse } from "@/src/lib/formatter";
import { withAuth } from "@/src/middleware/auth";
import {
  errorResponse,
  notFound,
  successResponse,
  unauthorized,
} from "@/src/lib/response";
import { NotificationService } from "@/src/services/notificationService";

/**
 * POST /friends/requests/{requestId}/accept
 * Accepts a pending friend request.
 */
const postHandler = async (
  request: NextRequest,
  payload: { userId: string; name: string },
  context: { params: { requestId: string } }
) => {
  try {
    const { userId } = payload;
    const { requestId } = context.params;

    const friendship = await prisma.friendship.findUnique({
      where: { id: requestId },
    });

    // 404: Request not found
    if (!friendship) return notFound("Request not found");

    // 401: Unauthorized (User is not the addressee of this request)
    if (friendship.addressee_id !== userId) return unauthorized();

    // Check if already accepted to maintain idempotency
    if (friendship.status === FriendshipStatus.ACCEPTED) {
      const existing = await prisma.friendship.findUnique({
        where: { id: requestId },
        include: { requester: true, addressee: true },
      });
      return successResponse(
        "Friendship accepted successfully",
        formatFriendshipResponse(existing)
      );
    }

    // Action: Update the Friendship record's status to ACCEPTED
    const updatedFriendship = await prisma.friendship.update({
      where: {
        id: requestId,
        status: FriendshipStatus.PENDING,
      },
      data: { status: FriendshipStatus.ACCEPTED },
      include: {
        requester: true,
        addressee: true,
      },
    });

    NotificationService.create({
      recipientId: friendship.requester_id,
      type: "FRIEND_ACCEPTED" as NotificationType,
      title: `${payload.name} has accepted your friend request`,
      message: `Start settling your pAIse with ${payload.name}`,
      data: { url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/friends/${userId}` },
    });

    return successResponse(
      "Friendship accepted successfully",
      formatFriendshipResponse(updatedFriendship)
    );
  } catch (error: any) {
    console.log("Error accepting friend request: ", error);
    if (error.message.includes("token")) {
      return errorResponse("unauthorized");
    }
    // Handle case where request was not found or not pending (e.g., race condition)
    if (error.code === "P2025" || error.code === "P2016") {
      return notFound("Request not found or already handled");
    }
    return errorResponse("Internal server error");
  }
};

export const POST = withAuth(postHandler);
