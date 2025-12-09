import { NextRequest } from "next/server";
import { prisma } from "@/src/lib/db";
import { withAuth } from "@/src/middleware/auth";
import { successResponse, errorResponse, notFound } from "@/src/lib/response";
import { z } from "zod";

const lookupSchema = z.object({
  code: z.string().min(5).max(20),
});

const getHandler = async (
  request: NextRequest,
  payload: { userId: string }
) => {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");

    const validation = lookupSchema.safeParse({ code });

    if (!validation.success) {
      return errorResponse("Invalid code format", 400);
    }

    const user = await prisma.user.findUnique({
      where: { invite_code: validation.data.code },
      select: {
        id: true,
        name: true,
        avatar: true, // Assuming you have an avatar field
      },
    });

    if (!user) {
      return notFound("User not found");
    }

    // 3. Prevent Self-Scan
    if (user.id === payload.userId) {
      return errorResponse("You cannot scan your own code", 400);
    }

    return successResponse("User found", user);
  } catch (error) {
    return errorResponse("Lookup failed", 500);
  }
};

export const GET = withAuth(getHandler);
