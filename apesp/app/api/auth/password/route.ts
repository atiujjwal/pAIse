import { badRequest, errorResponse, successResponse } from "@/src/lib/response";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/src/lib/db";
import { hashPassword } from "@/src/lib/auth";

const changePasswordSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
  newPassword: z.string().min(8),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, otp, newPassword } = changePasswordSchema.parse(body);

    const otpRecord = await prisma.userOtp.findFirst({
      where: {
        email,
        otp,
        type: "forgot_password",
        used: false,
        expires_at: { gt: new Date() },
      },
    });

    if (!otpRecord) {
      return badRequest("Invalid or expired OTP");
    }

    await prisma.userOtp.update({
      where: { id: otpRecord.id },
      data: { used: true },
    });

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    return successResponse("Password changed successfully");
  } catch (error) {
    console.log("Error changing password: ", error);
    if (error instanceof z.ZodError) {
      return badRequest("Invalid request", error.issues);
    }
    return errorResponse("Internal server error");
  }
}