import { NextRequest } from "next/server";
import { prisma } from "@/src/lib/db";
import { errorResponse, successResponse } from "@/src/lib/response";
import { withAuth } from "@/src/middleware/auth";

/**
 * GET /users/me/groups
 * Lists all groups the authenticated user is a member of.
 * Supports search and pagination.
 */
const getHandler = async (
  request: NextRequest,
  payload: { userId: string }
) => {
  try {
    const { userId } = payload;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const search = searchParams.get("search");

    const groupFilter = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { description: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const memberships = await prisma.groupMember.findMany({
      where: {
        user_id: userId,
        group: groupFilter,
      },
      include: {
        group: {
          include: {
            _count: {
              select: { members: true },
            },
          },
        },
      },
      take: limit,
      skip: offset,
      orderBy: {
        group: {
          name: "asc",
        },
      },
    });

    const groups = memberships.map((mem) => ({
      id: mem.group.id,
      name: mem.group.name,
      description: mem.group.description,
      avatar_url: mem.group.avatar_url,
      owner_id: mem.group.owner_id,
      created_at: mem.group.created_at,
      member_count: mem.group._count.members,
    }));

    return successResponse("Groups fetched successfully", { groups: groups });
  } catch (error: any) {
    console.log("Error getting groups: ", error);
    if (error.message.includes("token")) return errorResponse("unauthorized");
    return errorResponse("Internal server error");
  }
};

export const GET = withAuth(getHandler);
