import { NextRequest } from "next/server";
import { FriendshipStatus } from "@prisma/client";
import { Decimal } from "decimal.js";
import {
  badRequest,
  errorResponse,
  forbidden,
  notFound,
  successResponse,
  unauthorized,
} from "@/src/lib/response";
import { prisma } from "@/src/lib/db";
import { withAuth } from "@/src/middleware/auth";

/**
 * POST /users/{userId}/block
 * Blocks a user, preventing all interaction.
 * RESTRICTION: Cannot block if there are outstanding financial debts.
 */
const postHandler = async (
  request: NextRequest,
  payload: { userId: string },
  context: { params: { userId: string } }
) => {
  try {
    const { userId: myId } = payload;
    const { userId: userToBlockId } = context.params;

    // 400: Cannot block yourself
    if (myId === userToBlockId) return badRequest("Cannot block yourself");

    // 404: User not found
    const userToBlock = await prisma.user.findUnique({
      where: { id: userToBlockId, is_deleted: false },
    });
    if (!userToBlock) return notFound("User not found");

    // Determine alphabetical order for user_A_id and user_B_id
    const [user_A_id, user_B_id] = [myId, userToBlockId].sort();

    // Check if there are any non-zero balances between these two users
    // (This covers both direct balances AND balances inside groups)
    const existingBalances = await prisma.balance.findMany({
      where: {
        user_A_id: user_A_id,
        user_B_id: user_B_id,
      },
    });

    const hasOutstandingDebt = existingBalances.some(
      (b) => !new Decimal(b.amount).isZero()
    );

    if (hasOutstandingDebt) {
      return forbidden(
        "Cannot block this user. You have outstanding debts/credits with them (direct or in groups). Please settle up first."
      );
    }

    const [_, blockedFriendship] = await prisma.$transaction([
      // Delete any and all existing relationships between these two users
      prisma.friendship.deleteMany({
        where: {
          OR: [
            { requester_id: myId, addressee_id: userToBlockId },
            { requester_id: userToBlockId, addressee_id: myId },
          ],
        },
      }),

      // Create the new "BLOCKED" record, with me as the requester
      prisma.friendship.create({
        data: {
          requester_id: myId,
          addressee_id: userToBlockId,
          status: FriendshipStatus.BLOCKED,
        },
      }),

      // Delete any existing Balance records (as per spec)
      prisma.balance.deleteMany({
        where: {
          user_A_id: user_A_id,
          user_B_id: user_B_id,
        },
      }),
    ]);

    return successResponse("User blocked successfully.", {
      id: blockedFriendship.id,
      status: blockedFriendship.status,
    });
  } catch (error: any) {
    console.log("Error blocking the user: ", error);
    if (error.message.includes("token")) {
      return unauthorized();
    }
    return errorResponse("Internal server error");
  }
};

export const POST = withAuth(postHandler);
