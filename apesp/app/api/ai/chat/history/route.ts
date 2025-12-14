import { NextRequest } from "next/server";
import { prisma } from "@/src/lib/db";
import { errorResponse, successResponse } from "@/src/lib/response";
import { getTokenFromRequest, verifyToken } from "@/src/lib/auth";

export async function GET(req: NextRequest) {
  const token = await getTokenFromRequest(req);
  let userId: any = "";
  if (token) {
    const payload = await verifyToken(token, "accessToken");
    if (!payload) return errorResponse("Unauthorized", 401);
    userId = payload.userId;
  } else {
    return errorResponse("Unauthorized", 401);
  }

  if (!userId) {
    return errorResponse("Unauthorized", 401);
  }
  try {
    const messages = await prisma.aiChatMessage.findMany({
      where: { user_id: userId },
      orderBy: { createdAt: "asc" },
      take: 20, // Load last 20 messages
    });

    return successResponse("History fetched", { messages });
  } catch (error) {
    return errorResponse("Failed to load history");
  }
}
