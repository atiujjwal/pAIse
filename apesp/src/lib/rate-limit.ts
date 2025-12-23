import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

if (
  !process.env.UPSTASH_REDIS_REST_URL ||
  !process.env.UPSTASH_REDIS_REST_TOKEN
) {
  throw new Error("Redis environment variables are missing");
}

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

/**
 * GENERAL LIMITER
 */
export const generalLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, "10 s"),
  analytics: true,
  prefix: "@upstash/ratelimit/general",
});

/**
 * AUTH LIMITER
 * Strict limits for login/register to prevent brute force.
 */
export const authLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, "60 s"),
  analytics: true,
  prefix: "@upstash/ratelimit/auth",
});

/**
 * AI: PUBLIC CHAT LIMITER
 */
export const publicAiChatLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, "86400 s"),
  analytics: true,
  prefix: "@upstash/ratelimit/public-ai-chat",
});

/**
 * AI: PRIVATE CHAT LIMITER
 */
export const privateAiChatLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(10, "86400 s"),
  analytics: true,
  prefix: "@upstash/ratelimit/private-ai-chat",
});

/**
 * AI: VOICE EXPENSE LIMITER
 */
export const aiVoiceLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, "86400 s"),
  analytics: true,
  prefix: "@upstash/ratelimit/ai-voice",
});

/**
 * AI: SCAN RECEIPT LIMITER
 */
export const aiScanLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, "86400 s"), // 5 scans per minute
  analytics: true,
  prefix: "@upstash/ratelimit/ai-scan",
});
