import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/src/lib/db";
import { withAuth } from "@/src/middleware/auth";
import {
  badRequest,
  errorResponse,
  successResponse,
  unauthorized,
} from "@/src/lib/response";

const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  avatar: z.string().url().nullable().optional(),
  currency: z.string().min(2).optional(),
  timezone: z.string().optional(),
});

/**
 * GET /users/me
 * Retrieves the complete profile for the authenticated user.
 */
const getHandler = async (
  request: NextRequest,
  payload: { userId: string; sessionId: string }
) => {
  try {
    const userId = payload.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId, is_deleted: false },
    });

    if (!user) return unauthorized();

    const userProfile = {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar_url: user.avatar,
      currency: user.currency,
      timezone: user.timezone,
      created_at: user.created_at,
    };

    return successResponse("User's Profile fetched successfully", userProfile);
  } catch (error: any) {
    console.log("Error getting profile details: ", error);
    if (error.message.includes("token") || error.message.includes("header")) {
      return unauthorized();
    }
    return errorResponse("Internal server error");
  }
};

/**
 * PATCH /users/me
 * Allows the authenticated user to update their own profile information.
 */

const patchHandler = async (
  request: NextRequest,
  payload: { userId: string; sessionId: string }
) => {
  try {
    const body = await request.json();
    const userId = payload.userId;

    // Validate input
    const parseResult = updateProfileSchema.safeParse(body);
    if (!parseResult.success) {
      console.log("Invalid input: ", parseResult);
      return errorResponse("Invalid input");
    }
    if (!Object.keys(parseResult.data).length)
      return badRequest("Invalid input");

    // Update user in DB
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: parseResult.data,
    });

    // Return updated profile
    const userProfile = {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      avatar_url: updatedUser.avatar, // ALIAS from 'avatar' in schema
      currency: updatedUser.currency,
      timezone: updatedUser.timezone,
      created_at: updatedUser.created_at,
    };

    return successResponse(
      "Your profile's data updated successfully",
      userProfile
    );
  } catch (error: any) {
    console.log("Error updating user's details: ", error);
    if (error instanceof z.ZodError)
      return badRequest("Invalid input", error.issues);

    if (error.message.includes("token") || error.message.includes("header")) {
      return unauthorized();
    }
    return errorResponse("Internal server error");
  }
};

export const GET = withAuth(getHandler);
export const PATCH = withAuth(patchHandler);
