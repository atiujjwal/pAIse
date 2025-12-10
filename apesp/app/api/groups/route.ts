import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/src/lib/db";
import { GroupRole } from "@prisma/client";
import { withAuth } from "@/src/middleware/auth";
import { created, errorResponse } from "@/src/lib/response";

const createGroupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  avatar: z.string().url().nullable().optional(),
});

/**
 * POST /groups
 * Creates a new group.
 */
const postHandler = async (
  request: NextRequest,
  payload: { userId: string }
) => {
  try {
    const { userId } = payload;
    const body = await request.json();

    const parseResult = createGroupSchema.safeParse(body);
    if (!parseResult.success) {
      return errorResponse(
        "Invalid input",
        400,
        "BAD_REQUEST",
        parseResult.error.issues
      );
    }

    const { name, description, avatar } = parseResult.data;

    // create Group and GroupMember (as ADMIN)
    const newGroup = await prisma.group.create({
      data: {
        name,
        description: description || null,
        avatar: avatar || null,
        owner_id: userId,
        members: {
          create: {
            user_id: userId,
            role: GroupRole.ADMIN,
          },
        },
      },
    });

    // Format response
    return created("Group created successfully.", {
      id: newGroup.id,
      name: newGroup.name,
      description: newGroup.description,
      avatar: newGroup.avatar,
      owner_id: newGroup.owner_id,
      created_at: newGroup.created_at,
    });
  } catch (error: any) {
    console.log("Error creating group: ", error);
    if (error instanceof z.ZodError) {
      return errorResponse(
        "Invalid input",
        500,
        "INTERNAL_SERVER_ERROR",
        error.issues
      );
    }
    if (error.message.includes("token")) return errorResponse("unauthorized");
    return errorResponse("Internal server error");
  }
};

export const POST = withAuth(postHandler);
