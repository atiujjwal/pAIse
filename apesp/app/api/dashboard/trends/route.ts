import { NextRequest } from "next/server";
import { z } from "zod";
import { Decimal } from "decimal.js";
import { prisma } from "@/src/lib/db";
import { withAuth } from "@/src/middleware/auth";
import { errorResponse, successResponse } from "@/src/lib/response";

Decimal.set({ precision: 12 });

const trendsQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  range: z.enum(["this_week", "this_month", "this_year", "all"]).optional(),
  granularity: z.enum(["day", "week", "month", "year"]).default("day"),
  group_id: z.string().optional(),
});

/**
 * GET /analytics/trends
 * Returns time-series spending data + aggregated analysis for the selected period.
 * Features:
 * - Dynamic granularity (Daily, Weekly, Monthly, Yearly)
 * - Rich Time Filters (Week, Month, Year, Custom)
 * - Spending Analysis (Total vs Group vs Friend)
 * - Category Breakdown
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

    const { from, to, range, granularity, group_id } = validation.data;

    const now = new Date();
    let start: Date | undefined;
    let end: Date | undefined;

    if (from || to) {
      if (from) start = new Date(from);
      if (to) end = new Date(to);
    } else if (range) {
      end = new Date();
      if (range === "this_week") {
        const day = now.getDay();
        start = new Date(now);
        start.setDate(now.getDate() - day);
        start.setHours(0, 0, 0, 0);
      } else if (range === "this_month") {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
      } else if (range === "this_year") {
        start = new Date(now.getFullYear(), 0, 1);
      }
    } else {
      end = new Date();
      start = new Date();
      start.setDate(end.getDate() - 30);
    }

    const whereClause: any = {
      user_id: userId,
      expense: {
        status: "ACTIVE",
      },
    };

    if (start || end) {
      whereClause.expense.date = {};
      if (start) whereClause.expense.date.gte = start;
      if (end) whereClause.expense.date.lte = end;
    }

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
            category: true,
            group_id: true,
          },
        },
      },
      orderBy: {
        expense: { date: "asc" },
      },
    });

    const timeMap = new Map<string, Decimal>();
    const categoryMap = new Map<string, Decimal>();

    let totalSpent = new Decimal(0);
    let groupSpent = new Decimal(0);
    let friendSpent = new Decimal(0);

    const getKey = (date: Date) => {
      const d = new Date(date);

      if (granularity === "year") {
        return d.getFullYear().toString();
      } else if (granularity === "month") {
        return d.toISOString().slice(0, 7);
      } else if (granularity === "week") {
        d.setHours(0, 0, 0, 0);
        const day = d.getDay();
        d.setDate(d.getDate() - day);
        return d.toISOString().split("T")[0];
      }

      return d.toISOString().split("T")[0];
    };

    for (const split of splits) {
      const amount = split.amount_owed;
      const expense = split.expense;

      totalSpent = totalSpent.add(amount);
      if (expense.group_id) {
        groupSpent = groupSpent.add(amount);
      } else {
        friendSpent = friendSpent.add(amount);
      }

      const cat = expense.category;
      const currentCat = categoryMap.get(cat) || new Decimal(0);
      categoryMap.set(cat, currentCat.add(amount));

      const key = getKey(expense.date);
      const currentTrend = timeMap.get(key) || new Decimal(0);
      timeMap.set(key, currentTrend.add(amount));
    }

    const spendingByCategory = Array.from(categoryMap.entries())
      .map(([cat, amount]) => ({
        category: cat,
        amount: amount.toNumber(),
        percentage: !totalSpent.isZero()
          ? amount.div(totalSpent).mul(100).toDecimalPlaces(1).toNumber()
          : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    const trends = [];

    let fillStart = start;
    const fillEnd = end || new Date();

    if (!fillStart && splits.length > 0) {
      fillStart = splits[0].expense.date;
    } else if (!fillStart) {
      fillStart = new Date();
    }

    let currentPointer = new Date(fillStart);
    if (granularity === "week") {
      currentPointer.setDate(
        currentPointer.getDate() - currentPointer.getDay()
      );
    } else if (granularity === "month") {
      currentPointer.setDate(1);
    } else if (granularity === "year") {
      currentPointer.setMonth(0, 1);
    }

    const safeEnd = fillEnd > currentPointer ? fillEnd : currentPointer;

    while (currentPointer <= safeEnd) {
      const key = getKey(currentPointer);
      const amount = timeMap.get(key) || new Decimal(0);

      let formatOptions: Intl.DateTimeFormatOptions = {
        month: "short",
        day: "numeric",
      };
      if (granularity === "year") formatOptions = { year: "numeric" };
      if (granularity === "month")
        formatOptions = { month: "short", year: "numeric" };

      trends.push({
        date: key,
        amount: amount.toNumber(),
        display_date: currentPointer.toLocaleDateString("en-US", formatOptions),
      });

      if (granularity === "year") {
        currentPointer.setFullYear(currentPointer.getFullYear() + 1);
      } else if (granularity === "month") {
        currentPointer.setMonth(currentPointer.getMonth() + 1);
      } else if (granularity === "week") {
        currentPointer.setDate(currentPointer.getDate() + 7);
      } else {
        currentPointer.setDate(currentPointer.getDate() + 1);
      }
    }

    return successResponse("Analytics fetched successfully", {
      spending_analysis: {
        total_money_spent: totalSpent.toNumber(),
        group_money_spent: groupSpent.toNumber(),
        friend_money_spent: friendSpent.toNumber(),
        period: range || (from ? "custom" : "last_30_days"),
      },
      spending_by_category: spendingByCategory,
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
