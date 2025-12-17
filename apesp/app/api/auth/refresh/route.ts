import { NextRequest } from "next/server";
import { prisma } from "@/src/lib/db";
import {
  verifyToken,
  generateToken,
  getTokenFromRequest,
} from "@/src/lib/auth";
import {
  errorResponse,
  successResponse,
  unauthorized,
} from "@/src/lib/response";

export async function POST(request: NextRequest) {
  try {
    const refreshToken = getTokenFromRequest(request);
    if (!refreshToken) return unauthorized();

    const payload = verifyToken(refreshToken, "refreshToken");
    if (!payload) return unauthorized();

    // Lookup session
    const { name, userId, email, inviteCode, sessionId, avatar } = payload;

    const tokenRecord = await prisma.userToken.findFirst({
      where: {
        token: refreshToken,
        session_id: sessionId,
        user_id: userId,
      },
    });

    if (!tokenRecord || tokenRecord.expires_at < new Date())
      return unauthorized();

    const tokenPayload = {
      name,
      userId,
      email,
      inviteCode,
      avatar,
      sessionId,
    };

    // Rotate tokens for this session
    const newAccessToken = generateToken(tokenPayload, "accessToken");
    const newRefreshToken = generateToken(tokenPayload, "refreshToken");

    await prisma.userToken.create({
      data: {
        user_id: userId,
        session_id: sessionId,
        token: newRefreshToken,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    //delete existing token
    await prisma.userToken.delete({ where: { token: refreshToken } });

    return successResponse("Tokens refreshed successfully", {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      sessionId,
    });
  } catch (error: any) {
    console.log("Error refreshing tokens: ", error);
    return errorResponse("Error refreshing tokens");
  }
}
