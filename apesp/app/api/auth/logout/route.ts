import { NextRequest } from "next/server";
import { prisma } from "@/src/lib/db";
import { withAuth } from "@/src/middleware/auth";
import { Prisma } from "@prisma/client";
import { errorResponse, successResponse } from "@/src/lib/response";

async function handler(
  req: NextRequest,
  payload: { userId: string; sessionId: string }
) {
  const { userId, sessionId } = payload;
  let body;

  try {
    body = await req.json();
  } catch (error) {
    body = {};
  }

  const logoutAll = body.logout_all === true;

  // Use a transaction to ensure both delete operations succeed or fail together
  try {
    if (logoutAll) {
      // Logout from ALL devices
      await prisma.$transaction([
        prisma.userToken.deleteMany({
          where: { user_id: userId },
        }),
        prisma.session.deleteMany({
          where: { user_id: userId },
        }),
      ]);
    } else {
      // Default: logout only from this device
      await prisma.$transaction([
        prisma.userToken.deleteMany({
          where: { user_id: userId, session_id: sessionId },
        }),
        prisma.session.delete({
          where: { id: sessionId },
        }),
      ]);
    }

    const message = logoutAll
      ? "Logged out from all devices."
      : "Logged out from this device.";

    // Create the response object
    const response = successResponse(message);

    // Clear the cookies by setting maxAge to 0
    response.cookies.set("accessToken", "", { maxAge: 0, path: "/" });
    response.cookies.set("refreshToken", "", { maxAge: 0, path: "/" });

    return response;
  } catch (error) {
    console.error("Logout failed:", error);

    // Handle Prisma-specific errors:
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        // Even if session record is missing, we should still clear cookies
        const response = errorResponse(
          "Session already invalid or logged out."
        );
        response.cookies.set("accessToken", "", { maxAge: 0, path: "/" });
        response.cookies.set("refreshToken", "", { maxAge: 0, path: "/" });
        return response;
      }
    }

    // Generic server error
    return errorResponse("An error occurred during logout.");
  }
}

export const POST = withAuth(handler);
