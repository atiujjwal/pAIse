import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/src/lib/db";
import { withAuth } from "@/src/middleware/auth";
import {
  checkGroupAdmin,
  checkGroupMembership,
} from "@/src/services/groupService";
import {
  errorResponse,
  noContent,
  notFound,
  successResponse,
} from "@/src/lib/response";
import { formatGroupMember, formatPublicUser } from "@/src/lib/formatter";

const updateGroupSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  avatar: z.string().url().nullable().optional(),
});

/**
 * GET /groups/{groupId}
 * Retrieves the details for a single group.
 */
const getHandler = async (
  request: NextRequest,
  payload: { userId: string },
  context: { params: { groupId: string } }
) => {
  try {
    const { userId } = payload;
    const { groupId } = context.params;

    // 401: Unauthorized (User is not a member of this group).
    await checkGroupMembership(userId, groupId);

    // 404: Group not found
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        owner: true, // Include the User object for the owner
        members: {
          // Include the list of members
          include: {
            user: true, // Include the User object for each member
          },
        },
      },
    });

    if (!group) return notFound("Group not found");

    // Format response as per spec
    const response = {
      id: group.id,
      name: group.name,
      description: group.description,
      avatar: group.avatar,
      owner: formatPublicUser(group.owner),
      members: group.members.map(formatGroupMember),
    };

    return successResponse("Group data fetched successfully", response);
  } catch (error: any) {
    console.log("Error getting group details: ", error);
    if (error.message.includes("token")) return errorResponse("unauthorized");
    if (error.message === "NOT_FOUND_OR_UNAUTHORIZED") {
      return errorResponse("Group not found or unauthorized");
    }
    return errorResponse("Internal server error");
  }
};

/**
 * PUT /groups/{groupId}
 * Updates a group's details. Requires ADMIN role.
 */
const putHandler = async (
  request: NextRequest,
  payload: { userId: string },
  context: { params: { groupId: string } }
) => {
  try {
    const { userId } = payload;
    const { groupId } = context.params;
    const body = await request.json();

    // 403: Forbidden (User is not an ADMIN).
    // 401/404: Handled implicitly.
    await checkGroupAdmin(userId, groupId);

    const parseResult = updateGroupSchema.safeParse(body);
    if (!parseResult.success) {
      return errorResponse(
        "Invalid input",
        400,
        "BAD_REQUEST",
        parseResult.error.issues
      );
    }

    // Update the group
    const updatedGroup = await prisma.group.update({
      where: { id: groupId },
      data: parseResult.data,
    });

    return successResponse("Group details updated successfully", updatedGroup);
  } catch (error: any) {
    console.log("Error updating group details: ", error);
    if (error.message.includes("token")) return errorResponse("Unauthorized");
    if (error.message === "FORBIDDEN") return errorResponse("Forbidden");
    if (error.message === "NOT_FOUND_OR_UNAUTHORIZED") {
      return errorResponse("Group not found or unauthorized");
    }
    // Prisma P2025: Record to update not found
    if (error.code === "P2025") return errorResponse("Group not found");
    return errorResponse("Internal server error");
  }
};

/**
 * DELETE /groups/{groupId}
 * Deletes an entire group. Requires ADMIN role.
 */
const deleteHandler = async (
  request: NextRequest,
  payload: { userId: string },
  context: { params: { groupId: string } }
) => {
  try {
    const { userId } = payload;
    const { groupId } = context.params;

    // 403: Forbidden (User is not an ADMIN).
    await checkGroupAdmin(userId, groupId);

    // Delete the group. Relations will cascade delete (members, expenses, etc)
    await prisma.group.delete({
      where: { id: groupId },
    });

    return noContent();
  } catch (error: any) {
    console.log("Error deleting group: ", error);
    if (error.message.includes("token")) return errorResponse("Unauthorized");
    if (error.message === "FORBIDDEN") return errorResponse("Forbidden");
    if (error.message === "NOT_FOUND_OR_UNAUTHORIZED") {
      return errorResponse("Group not found or unauthorized"); // 404
    }
    // Prisma P2025: Record to delete not found
    if (error.code === "P2025") return errorResponse("Group not found");
    return errorResponse("Internal server error");
  }
};

export const GET = withAuth(getHandler);
export const PUT = withAuth(putHandler);
export const DELETE = withAuth(deleteHandler);
