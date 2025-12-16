import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";
import bcrypt from "bcryptjs";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

const JWT_SECRET = requireEnv("JWT_SECRET");
const JWT_DATA_SECRET = requireEnv("JWT_DATA_SECRET");
const JWT_REFRESH_SECRET = requireEnv("JWT_REFRESH_SECRET");
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN as `${number}${
  | "s"
  | "m"
  | "h"
  | "d"}`;
const JWT_REFRESH_EXPIRES_IN = process.env
  .JWT_REFRESH_EXPIRES_IN as `${number}${"s" | "m" | "h" | "d"}`;


export const tokenSecretMap = {
  "accessToken":{
    "expiresIn" : JWT_EXPIRES_IN,
    "secretKey" : JWT_SECRET
  },
  "refreshToken":{
      "expiresIn" : JWT_REFRESH_EXPIRES_IN,
      "secretKey" : JWT_REFRESH_SECRET
    },
    "friendRequest":{
      "expiresIn" : JWT_EXPIRES_IN,
      "secretKey" : JWT_DATA_SECRET
    },
};

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

type TokenType = "accessToken" | "refreshToken" | "friendRequest";

export const generateToken = (payload: any, type: TokenType): string => {

  const options: SignOptions = { expiresIn: tokenSecretMap[type].expiresIn };
  return jwt.sign(payload, tokenSecretMap[type].secretKey, options);
};

// ✅ Verify JWT token safely
export const verifyToken = (
  token: string,
  type: TokenType
): any => {
  try {
    const secret = tokenSecretMap[type].secretKey;
    const decoded = jwt.verify(token, secret);
    return decoded;
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
