import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/src/lib/db";
import { badRequest, errorResponse, successResponse } from "@/src/lib/response";
import { sendEmail } from "@/src/services/messageServices";

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const sendOtpSchema = z
  .object({
    email: z.string().email().optional(),
    phone: z.string().optional(),
    type: z.string().min(2), // "register", "login", "forgot_password"
  })
  .refine((data) => data.email || data.phone, {
    message: "Either email or phone is required",
  });

const verifyOtpSchema = z
  .object({
    email: z.string().email().optional(),
    phone: z.string().optional(),
    type: z.string().min(2),
    otp: z.string().length(6),
  })
  .refine((data) => data.email || data.phone, {
    message: "Either email or phone is required",
  });

// --- GET = send OTP ---
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const email = url.searchParams.get("email") || undefined;
    const phone = url.searchParams.get("phone") || undefined;
    const type = url.searchParams.get("type") || "";

    const validation = sendOtpSchema.safeParse({ email, phone, type });

    if (!validation.success) {
      return badRequest("Invalid input", validation.error);
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await prisma.userOtp.create({
      data: {
        email,
        phone,
        otp,
        type,
        expires_at: expiresAt,
      },
    });

    if (email) {
      switch (type) {
        case "register":
          sendEmail({
            to: email,
            templateId: 4,
            data: {},
            subject: "New Friend Request",
          });
          break;
        case "login":
          sendEmail({
            to: email,
            templateId: 4,
            data: {},
            subject: "New Friend Request",
          });
          break;
        case "forgot_password":
          sendEmail({
            to: email,
            templateId: 4,
            data: {},
            subject: "New Friend Request",
          });
          break;
        default:
          return badRequest("Invalid type");
      }
    } else if (phone) {
      // TODO: Integrate SMS provider here
      console.log(`[SMS MOCK] To: ${phone}, OTP: ${otp}`);
    }

    return successResponse("OTP sent successfully", {
      message: "OTP sent",
      expiresAt,
    });
  } catch (error) {
    console.error("Error sending OTP: ", error);
    return errorResponse("Internal server error");
  }
}

// --- POST = verify OTP ---
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = verifyOtpSchema.safeParse(body);

    if (!validation.success) {
      return badRequest("Invalid input", validation.error);
    }

    const { email, phone, type, otp } = validation.data;

    const whereClause: any = {
      otp,
      type,
      used: false,
      expires_at: { gt: new Date() },
    };

    if (email) whereClause.email = email;
    if (phone) whereClause.phone = phone;

    const otpRecord = await prisma.userOtp.findFirst({
      where: whereClause,
    });

    if (!otpRecord) {
      return badRequest("Invalid or expired OTP");
    }

    await prisma.userOtp.update({
      where: { id: otpRecord.id },
      data: { used: true },
    });

    return successResponse("OTP verified");
  } catch (error) {
    console.error("Error verifying OTP: ", error);
    return errorResponse("Internal server error");
  }
}
