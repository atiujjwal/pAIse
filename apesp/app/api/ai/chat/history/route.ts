import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/src/lib/db";
import { errorResponse, successResponse } from "@/src/lib/response";

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.JWT_SECRET });
  if (!token?.sub) return errorResponse("Unauthorized", 401);

  try {
    const messages = await prisma.aiChatMessage.findMany({
      where: { user_id: token.sub },
      orderBy: { createdAt: "asc" },
      take: 20, // Load last 20 messages
    });

    return successResponse("History fetched", { messages });
  } catch (error) {
    return errorResponse("Failed to load history");
  }
}
