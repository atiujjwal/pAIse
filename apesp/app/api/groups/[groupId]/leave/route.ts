import { NextRequest } from "next/server";
import { GroupRole } from "@prisma/client";
import { prisma } from "@/src/lib/db";
import { Decimal } from "decimal.js";
import {
  errorResponse,
  forbidden,
  noContent,
  notFound,
  unauthorized,
} from "@/src/lib/response";
import { withAuth } from "@/src/middleware/auth";

/**
 * POST /groups/{groupId}/leave
 * A convenience endpoint for the authenticated user to leave a group.
 */
const postHandler = async (
  request: NextRequest,
  payload: { userId: string },
  context: { params: { groupId: string } }
) => {
  try {
    const { userId: authUserId } = payload;
    const { groupId } = context.params;

    // Find the group to check owner
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: { owner_id: true },
    });

    if (!group) return notFound("Group not found");

    // Business Logic: Prevent owner from leaving
    if (group.owner_id === authUserId) {
      return forbidden(
        "Owner cannot leave the group. Delete the group or transfer ownership first."
      );
    }

    // Business Logic: Prevent last admin from leaving
    const membership = await prisma.groupMember.findUnique({
      where: {
        group_id_user_id: {
          group_id: groupId,
          user_id: authUserId,
        },
      },
    });

    if (!membership) return notFound("Group membership not found");

    if (membership.role === GroupRole.ADMIN) {
      const adminCount = await prisma.groupMember.count({
        where: { group_id: groupId, role: GroupRole.ADMIN },
      });
      if (adminCount <= 1) {
        return forbidden(
          "Cannot leave as the last admin. Promote another user first."
        );
      }
    }

    // Financial Integrity Check
    const userBalances = await prisma.balance.findMany({
      where: {
        group_id: groupId,
        OR: [{ user_A_id: authUserId }, { user_B_id: authUserId }],
      },
    });

    // Check if any balance is non-zero
    if (userBalances.some((b) => !new Decimal(b.amount).isZero())) {
      return forbidden(
        "Cannot leave group while you have outstanding debts. Please settle up first."
      );
    }

    // Delete membership AND cleanup zero-balance rows atomically
    await prisma.$transaction(async (tx) => {
      // 1. Clean up the 0.00 balance rows
      await tx.balance.deleteMany({
        where: {
          group_id: groupId,
          OR: [{ user_A_id: authUserId }, { user_B_id: authUserId }],
        },
      });

      // Delete the membership
      await tx.groupMember.delete({
        where: {
          group_id_user_id: {
            group_id: groupId,
            user_id: authUserId,
          },
        },
      });
    });

    return noContent();
  } catch (error: any) {
    console.log("Error leaving group: ", error);
    if (error.message.includes("token")) return unauthorized();
    if (error.code === "P2025") return notFound("Group or user membership");
    return errorResponse("Internal server error");
  }
};

export const POST = withAuth(postHandler);
