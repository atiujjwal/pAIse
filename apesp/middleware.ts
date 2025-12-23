import { NextRequest, NextResponse } from "next/server";
import {
  authLimiter,
  publicAiChatLimiter,
  privateAiChatLimiter,
  aiVoiceLimiter,
  aiScanLimiter,
  generalLimiter,
} from "@/src/lib/rate-limit";
import { getTokenFromRequest, verifyToken } from "./src/lib/auth";

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  if (pathname.startsWith("/api")) {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    let message = "";
    let limit = null;

    if (pathname.startsWith("/api/ai")) {
      let userId: any = "";
      message = "Ai Chat Limit reached for today";
      const token = await getTokenFromRequest(req);
      if (token) {
        const payload = await verifyToken(token, "accessToken");
        userId = payload.userId;
      }

      const limitKey = userId || ip;
      const limitType = userId ? "PRIVATE" : "PUBLIC";
      if (pathname.includes("chat")) {
        if (limitType == "PUBLIC") {
          limit = await publicAiChatLimiter.limit(limitKey);
        } else if (limitType == "PRIVATE")
          limit = await privateAiChatLimiter.limit(ip);
      } else if (pathname.includes("/voice-expense")) {
        message = "Ai Voice Expense Limit reached for today";
        limit = await aiVoiceLimiter.limit(ip);
      } else if (pathname.includes("/scan-receipt")) {
        message = "Ai Scan Receipt Limit reached for today";
        limit = await aiScanLimiter.limit(ip);
      } else {
        limit = await publicAiChatLimiter.limit(ip);
      }
    } else if (pathname.startsWith("/api/auth")) {
      message = "Please slow down and retry after 60 seconds.";
      limit = await authLimiter.limit(ip);
    } else if (req.method === "POST") {
      message = "Please slow down and retry after 10 seconds.";
      limit = await generalLimiter.limit(ip);
    } else if (req.method === "GET") {
      return NextResponse.next();
    }

    if (limit && !limit.success) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          message: message || "Too many requests. Please slow down.",
          retryAfter: limit.reset,
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "X-RateLimit-Limit": limit.limit.toString(),
            "X-RateLimit-Remaining": limit.remaining.toString(),
            "X-RateLimit-Reset": limit.reset.toString(),
          },
        }
      );
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all request paths except for: _next/static, _next/image, favicon.ico, Public assets
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
