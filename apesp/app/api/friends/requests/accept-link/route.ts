import { NextRequest } from "next/server";
import { prisma } from "@/src/lib/db";
import { z } from "zod";
import { withAuth } from "@/src/middleware/auth";
import {
  errorResponse,
  successResponse,
  badRequest,
  notFound,
} from "@/src/lib/response";
import { verifyToken } from "@/src/lib/auth";

const acceptLinkSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

const postHandler = async (
  request: NextRequest,
  payload: { userId: string }
) => {
  try {
    const body = await request.json();
    const { token } = acceptLinkSchema.parse(body);
    const { userId: currentUserId } = payload;

    let decoded;
    try {
      decoded = await verifyToken(token, "friendRequest");
    } catch (e) {
      return badRequest("Invalid or expired link");
    }

    const { requestId, email } = decoded;

    const friendship = await prisma.friendship.findUnique({
      where: { id: requestId },
      include: { addressee: true },
    });

    if (!friendship) {
      return badRequest("This request no longer exists or was cancelled.");
    }

    if (friendship.addressee_id !== currentUserId) {
      return errorResponse("This link was sent to a different user.", 403);
    }

    if (friendship.status === "ACCEPTED") {
      return successResponse("Friend request already accepted.");
    }

    await prisma.friendship.update({
      where: { id: requestId },
      data: { status: "ACCEPTED" },
    });

    return successResponse("Friend request accepted successfully");
  } catch (error: any) {
    console.error("Magic link error:", error);
    if (error instanceof z.ZodError) return badRequest("Invalid input");
    return errorResponse("Internal server error");
  }
};

export const POST = withAuth(postHandler);
