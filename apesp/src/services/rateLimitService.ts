import { prisma } from "@/src/lib/db";

const PUBLIC_LIMIT = 25;
const PRIVATE_LIMIT = 100;
const RESET_PERIOD = 24 * 60 * 60 * 1000;

export class RateLimitService {
  static async checkLimit(key: string, type: "PUBLIC" | "PRIVATE") {
    const limit = type === "PUBLIC" ? PUBLIC_LIMIT : PRIVATE_LIMIT;
    const now = new Date();

    let usage = await prisma.chatUsage.findUnique({ where: { key } });

    if (usage && now > usage.resetAt) {
      await prisma.chatUsage.delete({ where: { key } });
      usage = null;
    }

    if (!usage) {
      await prisma.chatUsage.create({
        data: {
          key,
          count: 1,
          resetAt: new Date(now.getTime() + RESET_PERIOD),
        },
      });
      return { allowed: true, remaining: limit - 1 };
    }

    if (usage.count >= limit) {
      return {
        allowed: false,
        message:
          type === "PUBLIC"
            ? "Free limit reached. Please log in."
            : "Daily limit reached. Upgrade to Pro.",
      };
    }

    // Increment count
    await prisma.chatUsage.update({
      where: { key },
      data: { count: { increment: 1 } },
    });

    return { allowed: true, remaining: limit - usage.count - 1 };
  }
}
