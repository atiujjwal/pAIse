import { NextRequest } from "next/server";
import { prisma } from "@/src/lib/db";
import { withAuth } from "@/src/middleware/auth";
import { badRequest, errorResponse, successResponse } from "@/src/lib/response";

/**
 * GET /users/search
 * Searches for users by name or email.
 */
const getHandler = async (
  request: NextRequest,
  payload: { userId: string }
) => {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    if (!query || query.trim() === "")
      return badRequest("Query parameter is missing");

    const myId = payload.userId;

    const users = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: myId } },
          { is_deleted: false },
          {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { email: { contains: query, mode: "insensitive" } },
            ],
          },
        ],
      },
      select: {
        id: true,
        name: true,
        avatar: true,
      },
      take: limit,
      skip: offset,
    });

    const formattedUsers = users.map((user) => ({
      id: user.id,
      name: user.name,
      avatar: user.avatar,
    }));

    return successResponse("Users searched successfully", {
      users: formattedUsers,
    });
  } catch (error: any) {
    if (error.message.includes("token") || error.message.includes("header")) {
      return errorResponse("Unauthorized");
    }
    return errorResponse("Internal server error");
  }
};

export const GET = withAuth(getHandler);
