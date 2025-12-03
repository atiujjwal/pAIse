import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/src/lib/db";
import { withAuth } from "@/src/middleware/auth";
import { Decimal } from "decimal.js";

Decimal.set({ precision: 12 });

import { checkGroupAdmin } from "@/src/services/groupService";

import {
  errorResponse,
  badRequest,
  forbidden,
  notFound,
  noContent,
  successResponse,
} from "@/src/lib/response";

import { formatGroupMember } from "@/src/lib/formatter";
import { GroupRole } from "@prisma/client";

const updateRoleSchema = z.object({
  role: z.enum([GroupRole.ADMIN, GroupRole.MEMBER]),
});

/**
 * DELETE /groups/{groupId}/members/{userId}
 * Removes a user from a group. Requires ADMIN role.
 */
const deleteHandler = async (
  request: NextRequest,
  payload: { userId: string },
  context: { params: { groupId: string; userId: string } }
) => {
  try {
    const { userId: authUserId } = payload;
    const { groupId, userId: userToRemoveId } = context.params;

    // 403: Forbidden (User is not an ADMIN).
    await checkGroupAdmin(authUserId, groupId);

    // Fetch group owner
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: { owner_id: true },
    });

    if (!group) return notFound("Group not found");

    // 403: Forbidden (User is not an ADMIN).
    if (group.owner_id === userToRemoveId)
      return forbidden(
        "Cannot remove the group owner. Transfer ownership first."
      );

    // Prevent removing last admin + (self-removal protection)
    if (authUserId === userToRemoveId) {
      const adminCount = await prisma.groupMember.count({
        where: {
          group_id: groupId,
          role: GroupRole.ADMIN,
        },
      });

      if (adminCount <= 1)
        return forbidden("Cannot remove the last admin from the group.");
    }

    // Financial Integrity Check
    const userBalances = await prisma.balance.findMany({
      where: {
        group_id: groupId,
        OR: [{ user_A_id: userToRemoveId }, { user_B_id: userToRemoveId }],
      },
    });

    // Check if any balance is non-zero
    if (userBalances.some((b) => !new Decimal(b.amount).isZero())) {
      return forbidden(
        "Cannot remove this member. They have outstanding debts/credits."
      );
    }

    // Delete membership AND cleanup zero-balance rows atomically
    await prisma.$transaction(async (tx) => {
      // Clean up the 0.00 balance rows
      await tx.balance.deleteMany({
        where: {
          group_id: groupId,
          OR: [{ user_A_id: userToRemoveId }, { user_B_id: userToRemoveId }],
        },
      });

      // Delete the membership
      await tx.groupMember.delete({
        where: {
          group_id_user_id: {
            group_id: groupId,
            user_id: userToRemoveId,
          },
        },
      });
    });

    return noContent();
  } catch (error: any) {
    console.log("Error removing group member:", error);
    if (error.message.includes("token"))
      return errorResponse("Unauthorized", 401);
    if (error.message === "FORBIDDEN") return forbidden();
    if (error.message === "NOT_FOUND_OR_UNAUTHORIZED")
      return notFound("Group not found");

    // Prisma: record not found
    if (error.code === "P2025") return notFound("Member not found");
    return errorResponse("Internal server error");
  }
};

/**
 * PATCH /groups/{groupId}/members/{userId}
 * Updates a member’s role (promote/demote). Requires ADMIN role.
 */
const patchHandler = async (
  request: NextRequest,
  payload: { userId: string },
  context: { params: { groupId: string; userId: string } }
) => {
  try {
    const { userId: authUserId } = payload;
    const { groupId, userId: userToUpdateId } = context.params;

    const body = await request.json();

    // Ensure admin  + Forbidden (User is not an ADMIN).
    await checkGroupAdmin(authUserId, groupId);

    const parse = updateRoleSchema.safeParse(body);
    if (!parse.success) return badRequest("Invalid input", parse.error.issues);

    const { role } = parse.data;

    // Find the group to check owner
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: { owner_id: true },
    });

    if (!group) return notFound("Group not found");

    // Prevent owner from being demoted
    if (group.owner_id === userToUpdateId && role === GroupRole.MEMBER) {
      return forbidden(
        "Cannot demote the group owner. Transfer ownership first."
      );
    }

    // If demoting from admin → member, ensure not last admin
    if (role === GroupRole.MEMBER) {
      const memberToUpdate = await prisma.groupMember.findUnique({
        where: {
          group_id_user_id: {
            group_id: groupId,
            user_id: userToUpdateId,
          },
        },
      });

      if (memberToUpdate?.role === GroupRole.ADMIN) {
        const adminCount = await prisma.groupMember.count({
          where: { group_id: groupId, role: GroupRole.ADMIN },
        });

        if (adminCount <= 1) return forbidden("Cannot demote the last admin.");
      }
    }

    // Update membership
    const updatedMember = await prisma.groupMember.update({
      where: {
        group_id_user_id: {
          group_id: groupId,
          user_id: userToUpdateId,
        },
      },
      data: { role },
      include: { user: true },
    });

    return successResponse(
      "Member role updated successfully",
      formatGroupMember(updatedMember)
    );
  } catch (error: any) {
    console.log("Error updating member role:", error);
    if (error instanceof z.ZodError) {
      return badRequest("Invalid input", error.issues);
    }
    if (error.message.includes("token"))
      return errorResponse("Unauthorized", 401);
    if (error.message === "FORBIDDEN") return forbidden();
    if (error.message === "NOT_FOUND_OR_UNAUTHORIZED") {
      return notFound("Group not found");
    }
    if (error.code === "P2025") return notFound("Member not found");
    return errorResponse("Internal server error");
  }
};

export const DELETE = withAuth(deleteHandler);
export const PATCH = withAuth(patchHandler);
