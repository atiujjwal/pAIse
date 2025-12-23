import { NextRequest } from "next/server";
import { getTokenFromRequest, verifyToken } from "../lib/auth";
import { errorResponse, unauthorized } from "../lib/response";

type AppRouteHandler = (
  req: NextRequest,
  payload: any,
  context: { params: any }
) => Promise<Response>;

export function withAuth(handler: AppRouteHandler) {
  return async (req: NextRequest, context: { params: any }) => {
    const token = getTokenFromRequest(req);
    if (!token) return unauthorized("Unauthorized - No token");

    try {
      const payload = await verifyToken(token, "accessToken");
      if (!payload) return unauthorized("Unauthorized - Invalid token");
      const resolvedParams = await context.params;
      return handler(req, payload, { params: resolvedParams });
    } catch (error) {
      return errorResponse("Unauthorized - Token error");
    }
  };
}
