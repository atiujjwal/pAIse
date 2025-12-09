import { NextRequest } from "next/server";
import { prisma } from "@/src/lib/db";
import { withAuth } from "@/src/middleware/auth";
import { successResponse, errorResponse } from "@/src/lib/response";
import { generateInviteCode } from "@/src/lib/nanoid";

const patchHandler = async (
  request: NextRequest,
  payload: { userId: string }
) => {
  try {
    const { userId } = payload;
    const newCode = generateInviteCode();

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { invite_code: newCode },
      select: { invite_code: true },
    });

    return successResponse("Invite code rotated successfully", updatedUser);
  } catch (error) {
    console.log("Error in update user's invite code: ", error);
    return errorResponse("Failed to rotate code", 500);
  }
};

export const PATCH = withAuth(patchHandler);
