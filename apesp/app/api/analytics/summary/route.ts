import { NextRequest } from "next/server";
import { z } from "zod";
import { Decimal } from "decimal.js";
import { prisma } from "@/src/lib/db";
import { withAuth } from "@/src/middleware/auth";
import { errorResponse, successResponse } from "@/src/lib/response";

// Robust schema for query validation
const summaryQuerySchema = z.object({
  from_date: z.string().datetime().optional(),
  to_date: z.string().datetime().optional(),
  group_id: z.string().optional(),
  category: z.string().optional(),
});

/**
 * GET /analytics/summary
 * Returns aggregated spending metrics dynamically calculated from expense splits.
 * Supports filtering by date range, group, and category.
 */
const getHandler = async (
  request: NextRequest,
  payload: { userId: string }
) => {
  try {
    const { userId } = payload;
    const { searchParams } = new URL(request.url);
    const rawQuery = Object.fromEntries(searchParams.entries());

    const validation = summaryQuerySchema.safeParse(rawQuery);
    if (!validation.success) {
      return errorResponse(
        "Invalid query parameters",
        400,
        "BAD_REQUEST",
        validation.error.issues
      );
    }

    const { from_date, to_date, group_id, category } = validation.data;

    // 1. Build Filter Context
    // We query ExpenseSplit because it represents the user's ACTUAL share of cost.
    const whereClause: any = {
      user_id: userId,
      expense: {
        status: "ACTIVE", // Ignore deleted expenses
      },
    };

    // Apply Date Range
    if (from_date || to_date) {
      whereClause.expense.date = {};
      if (from_date) whereClause.expense.date.gte = new Date(from_date);
      if (to_date) whereClause.expense.date.lte = new Date(to_date);
    }

    // Apply Filters
    if (group_id) whereClause.expense.group_id = group_id;
    if (category) whereClause.expense.category = category;

    // 2. Fetch Data (Aggregated by Category)
    // We group by expense -> category to get precise breakdown
    const splits = await prisma.expenseSplit.findMany({
      where: whereClause,
      select: {
        amount_owed: true,
        expense: {
          select: {
            category: true,
          },
        },
      },
    });

    // 3. Aggregate in Memory
    // (Prisma groupBy doesn't support joining relations easily for filtering,
    // so fetching lightweight objects and reducing in JS is performant for <10k records)
    let totalSpent = new Decimal(0);
    const categoryMap = new Map<string, Decimal>();

    for (const split of splits) {
      const amount = split.amount_owed;
      const cat = split.expense.category;

      totalSpent = totalSpent.add(amount);
      const current = categoryMap.get(cat) || new Decimal(0);
      categoryMap.set(cat, current.add(amount));
    }

    // 4. Fetch User Context (Currency)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { currency: true },
    });

    // 5. Format Response
    const spendingByCategory = Array.from(categoryMap.entries())
      .map(([cat, amount]) => ({
        category: cat,
        amount: amount.toNumber(),
        percentage: !totalSpent.isZero()
          ? amount.div(totalSpent).mul(100).toDecimalPlaces(1).toNumber()
          : 0,
      }))
      .sort((a, b) => b.amount - a.amount); // Sort desc by spend

    return successResponse("Analytics summary fetched successfully", {
      total_spent: totalSpent.toNumber(),
      currency: user?.currency || "INR",
      period: {
        from: from_date || "all-time",
        to: to_date || "now",
      },
      spending_by_category: spendingByCategory,
    });
  } catch (error: any) {
    console.error("Error fetching analytics summary:", error);
    if (error.message?.includes("token"))
      return errorResponse("Unauthorized", 401);
    return errorResponse("Internal server error");
  }
};

export const GET = withAuth(getHandler);
