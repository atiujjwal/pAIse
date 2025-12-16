import { NextRequest } from "next/server";
import { z } from "zod";
import { headers } from "next/headers";
import { prisma } from "@/src/lib/db";
import { comparePassword, generateToken, parseDevice } from "@/src/lib/auth";
import {
  errorResponse,
  successResponse,
  unauthorized,
} from "@/src/lib/response";

const schema = z
  .object({
    email: z.string().email(),
    password: z.string().optional(),
    otp: z.string().optional(),
  })
  .refine((data) => data.password || data.otp, {
    message: "Either password or OTP is required",
  });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, otp } = schema.parse(body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return unauthorized("Invalid credentials");

    if (password) {
      const valid = await comparePassword(password, user.password);
      if (!valid) return unauthorized("Invalid credentials");
    } else if (otp) {
      const validOtp = await prisma.userOtp.findFirst({
        where: {
          type: "login",
          email: user.email,
          otp,
          expires_at: { gt: new Date() },
        },
      });

      if (!validOtp) return unauthorized("Invalid or expired OTP");
      await prisma.userOtp.delete({ where: { id: validOtp.id } });
    }

    const h = await headers();
    const userAgent = h.get("user-agent");
    const ip = h.get("x-forwarded-for") || "unknown";
    const device = parseDevice(userAgent);

    const session = await prisma.session.create({
      data: {
        user_id: user.id,
        device,
        user_agent: userAgent,
        ip_address: ip,
        last_activity: new Date(Date.now()),
      },
    });

    const sessionId = session.id;

    const tokenPayload = {
      name: user.name,
      userId: user.id,
      email: user.email,
      phone: user.phone,
      currency: user.currency,
      country: user.country,
      inviteCode: user.invite_code,
      avatar: user.avatar || undefined,
      sessionId,
    };

    const accessToken = generateToken(tokenPayload, "accessToken"); // 2h
    const refreshToken = generateToken(tokenPayload, "refreshToken"); // 7d

    // Save the refresh token in DB for this session
    await prisma.userToken.create({
      data: {
        user_id: user.id,
        session_id: sessionId,
        token: refreshToken,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // Return user and access token (short-lived)
    return successResponse("Login successful", {
      user: { id: user.id, email: user.email, name: user.name },
      accessToken,
      refreshToken,
      sessionId,
    });
  } catch (error: any) {
    console.log("Error logging-In: ", error);
    return errorResponse("Internal Server error");
  }
}
