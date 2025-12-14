import { NextRequest } from "next/server";
import { z } from "zod";
import { Decimal } from "decimal.js";
import { prisma } from "@/src/lib/db";
import { withAuth } from "@/src/middleware/auth";
import { errorResponse, successResponse } from "@/src/lib/response";

// Schema ensures proper date formatting and valid granularity
const trendsQuerySchema = z.object({
  from_date: z.string().datetime().optional(),
  to_date: z.string().datetime().optional(),
  granularity: z.enum(["day", "month"]).default("day"),
  group_id: z.string().optional(),
});

/**
 * GET /analytics/trends
 * Returns time-series spending data.
 * Features:
 * - Dynamic granularity (Daily vs Monthly)
 * - Gap filling (returns 0 for days with no spend)
 * - Context filtering (Group specific trends)
 */
const getHandler = async (
  request: NextRequest,
  payload: { userId: string }
) => {
  try {
    const { userId } = payload;
    const { searchParams } = new URL(request.url);
    const rawQuery = Object.fromEntries(searchParams.entries());

    const validation = trendsQuerySchema.safeParse(rawQuery);
    if (!validation.success) {
      return errorResponse(
        "Invalid parameters",
        400,
        "BAD_REQUEST",
        validation.error.issues
      );
    }

    const { from_date, to_date, granularity, group_id } = validation.data;

    // 1. Determine Date Range
    // Default to last 30 days if not specified
    const end = to_date ? new Date(to_date) : new Date();
    const start = from_date
      ? new Date(from_date)
      : new Date(new Date().setDate(end.getDate() - 30));

    // 2. Query Source Data
    // We fetch raw expense splits for the user within the range
    const whereClause: any = {
      user_id: userId,
      expense: {
        status: "ACTIVE",
        date: {
          gte: start,
          lte: end,
        },
      },
    };

    if (group_id) {
      whereClause.expense.group_id = group_id;
    }

    const splits = await prisma.expenseSplit.findMany({
      where: whereClause,
      select: {
        amount_owed: true,
        expense: {
          select: {
            date: true,
          },
        },
      },
      orderBy: {
        expense: { date: "asc" },
      },
    });

    // 3. Bucket Aggregation Logic
    const timeMap = new Map<string, Decimal>();

    // Helper to generate bucket keys (YYYY-MM-DD or YYYY-MM)
    const getKey = (date: Date) => {
      const iso = date.toISOString().split("T")[0]; // YYYY-MM-DD
      return granularity === "month" ? iso.slice(0, 7) : iso; // YYYY-MM
    };

    // Fill map with data
    for (const split of splits) {
      const key = getKey(split.expense.date);
      const current = timeMap.get(key) || new Decimal(0);
      timeMap.set(key, current.add(split.amount_owed));
    }

    // 4. Gap Filling (Crucial for Charts)
    // Create a continuous timeline from start to end
    const trends = [];
    let currentPointer = new Date(start);

    while (currentPointer <= end) {
      const key = getKey(currentPointer);
      const amount = timeMap.get(key) || new Decimal(0);

      trends.push({
        date: key,
        amount: amount.toNumber(),
        // Optional: formatting for frontend display
        display_date: currentPointer.toLocaleDateString(
          "en-US",
          granularity === "month"
            ? { month: "short", year: "numeric" }
            : { month: "short", day: "numeric" }
        ),
      });

      // Increment Pointer
      if (granularity === "month") {
        currentPointer.setMonth(currentPointer.getMonth() + 1);
      } else {
        currentPointer.setDate(currentPointer.getDate() + 1);
      }
    }

    return successResponse("Trends fetched successfully", {
      granularity,
      trends,
    });
  } catch (error: any) {
    console.error("Error fetching analytics trends:", error);
    if (error.message?.includes("token"))
      return errorResponse("Unauthorized", 401);
    return errorResponse("Internal server error");
  }
};

export const GET = withAuth(getHandler);
