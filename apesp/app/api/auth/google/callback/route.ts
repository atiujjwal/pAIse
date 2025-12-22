import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/db";
import { generateToken, parseDevice } from "@/src/lib/auth";
import { getGoogleUser } from "@/src/lib/google";
import { generateInviteCode } from "@/src/lib/nanoid";
import { sendEmail } from "@/src/services/messageServices";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/auth/login?error=no_code", req.url));
  }

  try {
    const googleUser = await getGoogleUser(code);
    const { email, name, picture } = googleUser;
    
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      const inviteCode = generateInviteCode();

      user = await prisma.user.create({
        data: {
          email,
          name,
          avatar: picture,
          password: `oauth_${Math.random().toString(36).slice(2)}`,
          invite_code: inviteCode,
          currency: "INR",
          timezone: "Asia/Kolkata",
        },
      });

      // sendEmail({
      //   to: user.email,
      //   templateId: 2,
      //   data: { name: user.name },
      // }).catch(console.error);
    }

    const userAgent = req.headers.get("user-agent");
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const device = parseDevice(userAgent);

    const session = await prisma.session.create({
      data: {
        user_id: user.id,
        device,
        user_agent: userAgent,
        ip_address: ip,
        last_activity: new Date(),
      },
    });

    const tokenPayload = {
      name: user.name,
      userId: user.id,
      email: user.email,
      inviteCode: user.invite_code,
      avatar: user.avatar || undefined,
      sessionId: session.id,
    };

    const accessToken = generateToken(tokenPayload, "accessToken");
    const refreshToken = generateToken(tokenPayload, "refreshToken");

    await prisma.userToken.create({
      data: {
        user_id: user.id,
        session_id: session.id,
        token: refreshToken,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // Create the Redirect Response
    const response = NextResponse.redirect(new URL("/dashboard", req.url));

    // Set Cookies securely on the response
    const cookieOptions = {
      httpOnly: false,
      path: "/",
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
    };

    response.cookies.set("accessToken", accessToken, {
      ...cookieOptions,
      maxAge: 7200,
    });

    response.cookies.set("refreshToken", refreshToken, {
      ...cookieOptions,
      httpOnly: true,
      maxAge: 604800,
    });

    return response;
  } catch (error) {
    console.error("Google Auth Callback Error:", error);
    return NextResponse.redirect(
      new URL("/auth/login?error=auth_failed", req.url)
    );
  }
}
