import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";
import bcrypt from "bcryptjs";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

const JWT_SECRET = requireEnv("JWT_SECRET");
const JWT_REFRESH_SECRET = requireEnv("JWT_REFRESH_SECRET");
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN as `${number}${
  | "s"
  | "m"
  | "h"
  | "d"}`;
const JWT_REFRESH_EXPIRES_IN = process.env
  .JWT_REFRESH_EXPIRES_IN as `${number}${"s" | "m" | "h" | "d"}`;

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

type TokenPayload = {
  userId: string;
  email: string;
  inviteCode: string;
  avatar?: string;
  sessionId: string;
};

type TokenType = "accessToken" | "refreshToken";

export const generateToken = (
  payload: TokenPayload,
  type: TokenType
): string => {
  const options: SignOptions = {
    expiresIn: type === "accessToken" ? JWT_EXPIRES_IN : JWT_REFRESH_EXPIRES_IN,
  };
  const secret = type === "accessToken" ? JWT_SECRET : JWT_REFRESH_SECRET;
  return jwt.sign(payload, secret, options);
};

// ✅ Verify JWT token safely
export const verifyToken = (
  token: string,
  type: "accessToken" | "refreshToken"
): {
  userId: string;
  email: string;
  inviteCode: string;
  avatar: string;
  sessionId: string;
} | null => {
  try {
    const secret = type === "accessToken" ? JWT_SECRET : JWT_REFRESH_SECRET;
    const decoded = jwt.verify(token, secret);

    if (
      typeof decoded === "object" &&
      "userId" in decoded &&
      "sessionId" in decoded
    ) {
      return decoded as {
        userId: string;
        email: string;
        inviteCode: string;
        avatar: string;
        sessionId: string;
      };
    }
    return null;
  } catch {
    return null;
  }
};

export const getTokenFromRequest = (request: Request): string | null => {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice(7);
};

export const parseDevice = (userAgent: string | null) => {
  if (!userAgent) return "Unknown Device";
  const ua = userAgent.toLowerCase();

  if (/mobile|iphone|android/.test(ua)) return "Mobile";
  if (/ipad|tablet/.test(ua)) return "Tablet";
  if (/windows|macintosh|linux/.test(ua)) return "Desktop";

  return "Unknown Device";
};
