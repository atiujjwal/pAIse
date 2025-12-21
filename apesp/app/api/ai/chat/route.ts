import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { PublicAiService } from "@/src/services/publicAiService";
import { PrivateAiService } from "@/src/services/privateAiService";
import { RateLimitService } from "@/src/services/rateLimitService";
import { errorResponse, successResponse } from "@/src/lib/response";
import { getTokenFromRequest, verifyToken } from "@/src/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, publicHistory } = body;
    let userId: any = "";
    const ip = request.headers.get("x-forwarded-for") || "unknown_ip";

    const token = await getTokenFromRequest(request);
    if (token) {
      const payload = await verifyToken(token, "accessToken");
      userId = payload.userId;
    }

    const limitKey = userId || ip;
    const limitType = userId ? "PRIVATE" : "PUBLIC";
    const check = await RateLimitService.checkLimit(limitKey, limitType);

    if (!check.allowed) {
      return successResponse("You have Ai Chat Limit reached for today", {
        content: check.message,
        role: "ASSISTANT",
        isLimitReached: true,
      });
    }

    let responseText = "";
    
    if (userId) {
      const result = await PrivateAiService.handleUserQuery(userId, message);
      responseText = result.answer;
    } else {
      const historyContext = Array.isArray(publicHistory)
        ? publicHistory.slice(-3)
        : [];
      responseText = await PublicAiService.generateResponse(
        message,
        historyContext
      );
    }

    return successResponse("Success", {
      role: "ASSISTANT",
      content: responseText,
    });
  } catch (error) {
    console.error("Chat API Error:", error);
    return errorResponse("Internal server error", 500);
  }
}
