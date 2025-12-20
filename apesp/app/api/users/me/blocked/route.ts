import { NextRequest } from "next/server";
import { FriendshipStatus } from "@prisma/client";
import { prisma } from "@/src/lib/db";
import { withAuth } from "@/src/middleware/auth";
import { formatPublicUser } from "@/src/lib/formatter";
import { errorResponse, successResponse } from "@/src/lib/response";

/**
 * GET /users/me/blocked
 * Lists all users that the authenticated user has blocked.
 */
const getHandler = async (
  request: NextRequest,
  payload: { userId: string }
) => {
  try {
    const { userId } = payload;
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = Math.max(parseInt(searchParams.get("offset") || "0"), 0);

    const blockedFriendships = await prisma.friendship.findMany({
      where: {
        requester_id: userId,
        status: FriendshipStatus.BLOCKED,
      },
      include: {
        addressee: true,
      },
      orderBy: {
        updated_at: "desc",
      },
      take: limit,
      skip: offset,
    });

    const blockedUsers = blockedFriendships.map((f) =>
      formatPublicUser(f.addressee)
    );

    return successResponse("Blocked users fetched successfully", {
      blocked_users: blockedUsers,
      meta: {
        limit,
        offset,
        total: blockedUsers.length,
      },
    });
  } catch (error: any) {
    console.error("Error fetching blocked users:", error);
    if (error.message?.includes("token")) {
      return errorResponse("Unauthorized", 401);
    }
    return errorResponse("Internal server error");
  }
};

export const GET = withAuth(getHandler);
