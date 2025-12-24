import { NextRequest } from "next/server";
import { PublicAiService } from "@/src/services/ai/publicAiService";
import { PrivateAiService } from "@/src/services/ai/privateAiService";
import { errorResponse, successResponse } from "@/src/lib/response";
import { getTokenFromRequest, verifyToken } from "@/src/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, publicHistory } = body;
    let userId: any = "";

    const token = await getTokenFromRequest(request);
    if (token) {
      const payload = await verifyToken(token, "accessToken");
      userId = payload.userId;
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
