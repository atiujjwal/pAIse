import { z } from "zod";
import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/src/lib/db";
import { generateToken, hashPassword, parseDevice } from "@/src/lib/auth";
import { badRequest, errorResponse, successResponse } from "@/src/lib/response";
import { generateInviteCode } from "@/src/lib/nanoid";
import { sendEmail } from "@/src/services/messageServices";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  password: z.string().min(6),
  dob: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid date_of_birth",
    })
    .optional()
    .nullable(),
  avatar: z.string().url().optional().nullable(),
  country: z.string().optional().nullable(),
  currency: z.string().optional().nullable(),
  timezone: z.string().optional().nullable(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = registerSchema.parse(body);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existingUser) return badRequest("User already exists");

    // Hash password
    const hashedPassword = await hashPassword(data.password);
    const inviteCode = generateInviteCode();

    // Create user (convert date_of_birth to Date)
    const user = await prisma.user.create({
      data: {
        name: data.name.trim(),
        email: data.email,
        phone: data.phone,
        password: hashedPassword,
        dob: data.dob ? new Date(data.dob) : null,
        avatar: data.avatar ?? null,
        invite_code: inviteCode,
        country: data.country ?? null,
        currency: data.currency ?? "INR",
        timezone: data.timezone ?? "Asia/Kolkata",
      },
    });

    // Create a new session
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
      inviteCode: user.invite_code,
      avatar: user.avatar || undefined,
      sessionId,
    };

    const accessToken = generateToken(tokenPayload, "accessToken"); // 2h
    const refreshToken = generateToken(tokenPayload, "refreshToken"); // 7d

    sendEmail({
      to: user.email,
      templateId: 2,
      data: { name: user.name },
    });

    // Save the refresh token in DB for this session
    await prisma.userToken.create({
      data: {
        user_id: user.id,
        session_id: sessionId,
        token: refreshToken,
        // type: "refreshToken",
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // Return both tokens and session info to client
    return successResponse("User registered successfully", {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        date_of_birth: user.dob,
        avatar: user.avatar,
        country: user.country,
        currency: user.currency,
        timezone: user.timezone,
      },
      accessToken,
      refreshToken,
      sessionId,
    });
  } catch (error) {
    console.log("Error registering the user: ", error);
    if (error instanceof z.ZodError)
      return badRequest("Invalid request body", error.issues);

    return errorResponse("Internal server error");
  }
}
