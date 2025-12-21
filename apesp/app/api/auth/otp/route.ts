import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/src/lib/db";
import { badRequest, errorResponse, successResponse } from "@/src/lib/response";
import { sendEmail, sendSms } from "@/src/services/messageServices";

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
    name: z.string().optional(),
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
    const name = url.searchParams.get("name") || undefined;
    const email = url.searchParams.get("email") || undefined;
    const phone = url.searchParams.get("phone") || undefined;
    const type = url.searchParams.get("type") || "";

    const validation = sendOtpSchema.safeParse({ email, phone, type, name });

    if (!validation.success) {
      return badRequest("Invalid input", validation.error);
    }

    // Check for existing valid OTP
    const now = new Date();
    const oneMinuteFromNow = new Date(now.getTime() + 60 * 1000);

    const whereClause: any = {
      type,
      used: false,
      expires_at: { gt: now },
    };
    if (email) whereClause.email = email;
    if (phone) whereClause.phone = phone;

    const existingOtp = await prisma.userOtp.findFirst({
      where: whereClause,
      orderBy: { created_at: "desc" },
    });

    let otp = "";
    let expiresAt = new Date();

    if (existingOtp && existingOtp.expires_at > oneMinuteFromNow) {
      // console.log(`[OTP] Reusing existing valid OTP for ${email || phone}`); 
      otp = existingOtp.otp;
      expiresAt = existingOtp.expires_at;
    } else {
      if (existingOtp) {
        prisma.userOtp.delete({ where: { id: existingOtp.id } });
      }

      otp = generateOtp();
      expiresAt = new Date(now.getTime() + 90 * 1000); // 90 secs validity

      prisma.userOtp.create({
        data: {
          email,
          phone,
          otp,
          type,
          expires_at: expiresAt,
        },
      });
    }

    if (email) {
      switch (type) {
        case "register":
          await sendEmail({
            to: email,
            templateId: 2, // Welcome/Verify Template
            data: { otp, name },
            subject: "Verify your Email - pAIse",
          });
          break;
        case "login":
          await sendEmail({
            to: email,
            templateId: 9, // Login OTP Template
            data: { otp, name },
            subject: "Your Login Code - pAIse",
          });
          break;
        case "forgot_password":
          await sendEmail({
            to: email,
            templateId: 3, // Forgot Password Template
            data: { otp, name },
            subject: "Reset Password Request - pAIse",
          });
          break;
        default:
          return badRequest("Invalid OTP type");
      }
    } else if (phone) {
      sendSms({
        mobile: phone,
        body: `Your pAIse verification code is ${otp}. Valid for 5 mins.`,
      });
    }

    return successResponse("OTP sent successfully", {
      message: "OTP sent",
      // otp, // REMOVE in production for security!
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
