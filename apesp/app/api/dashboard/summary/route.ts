import { NextRequest } from "next/server";
import { z } from "zod";
import { Decimal } from "decimal.js";

import { prisma } from "@/src/lib/db";
import { withAuth } from "@/src/middleware/auth";
import { errorResponse, successResponse } from "@/src/lib/response";

const getHandler = async (
  request: NextRequest,
  payload: { userId: string }
) => {
  try {
    const { userId } = payload;
    const now = new Date();

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const currentMonthStr = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}`;

    const upcomingDate = new Date();
    upcomingDate.setDate(now.getDate() + 30);

    const balances = await prisma.balance.findMany({
      where: {
        OR: [{ user_A_id: userId }, { user_B_id: userId }],
      },
    });

    const totalBalance = balances.reduce((acc, balance) => {
      if (balance.user_A_id === userId) {
        return acc.add(balance.amount);
      } else {
        return acc.sub(balance.amount);
      }
    }, new Decimal(0));

    // We query ExpenseSplit to get the user's *actual* share, not just what they paid for.
    const userMonthlySplits = await prisma.expenseSplit.findMany({
      where: {
        user_id: userId,
        expense: {
          date: { gte: startOfMonth, lte: endOfMonth },
          status: "ACTIVE",
        },
      },
      include: {
        expense: {
          select: { category: true },
        },
      },
    });

    let totalSpent = new Decimal(0);
    const categoryMap = new Map<string, Decimal>();

    userMonthlySplits.forEach((split) => {
      const amount = split.amount_owed;
      const category = split.expense.category;
      totalSpent = totalSpent.add(amount);
      const currentCatTotal = categoryMap.get(category) || new Decimal(0);
      categoryMap.set(category, currentCatTotal.add(amount));
    });

    // Format category data for the chart
    const spendingByCategory = Array.from(categoryMap.entries()).map(
      ([category, amount]) => ({
        category,
        amount: amount.toNumber(),
      })
    );

    const monthlyBudgetAgg = await prisma.budget.aggregate({
      where: {
        user_id: userId,
        month: currentMonthStr,
      },
      _sum: {
        budget_amount: true,
      },
    });

    const budgetLimit = monthlyBudgetAgg._sum.budget_amount || new Decimal(0);
    const remainingBudget = budgetLimit.sub(totalSpent);

    // Calculate percentage (handle division by zero)
    let budgetUsedPercent = 0;
    if (!budgetLimit.isZero()) {
      budgetUsedPercent = totalSpent
        .div(budgetLimit)
        .mul(100)
        .toDecimalPlaces(1)
        .toNumber();
    } else if (totalSpent.gt(0)) {
      // If no budget set but money spent, theoretically 100% or "Over"
      budgetUsedPercent = 100;
    }

    const upcomingSubscriptions = await prisma.subscription.findMany({
      where: {
        user_id: userId,
        is_active: true,
        next_charge_date: {
          gte: now,
          lte: upcomingDate,
        },
      },
      orderBy: {
        next_charge_date: "asc",
      },
      take: 5,
    });

    const recentExpenses = await prisma.expense.findMany({
      where: {
        status: "ACTIVE",
        OR: [
          { created_by_id: userId }, 
          { splits: { some: { user_id: userId } } }, // OR I am involved in the split
        ],
      },
      include: {
        group: { select: { name: true } },
        created_by: { select: { name: true } },
      },
      orderBy: { date: "desc" },
      take: 5,
    });

    const summary = {
      total_balance: totalBalance.toNumber(),
      monthly_metrics: {
        total_spent: totalSpent.toNumber(),
        budget_limit: budgetLimit.toNumber(),
        remaining: remainingBudget.toNumber(),
        budget_used_percent: budgetUsedPercent,
      },
      spending_by_category: spendingByCategory,
      upcoming_subscriptions: upcomingSubscriptions.map((sub) => ({
        id: sub.id,
        name: sub.name,
        amount: sub.amount.toNumber(),
        next_charge_date: sub.next_charge_date,
      })),
      recent_expenses: recentExpenses.map((exp) => ({
        id: exp.id,
        description: exp.description,
        amount: exp.amount.toNumber(),
        date: exp.date,
        group: exp.group?.name || null,
        created_by: exp.created_by.name,
      })),
    };

    return successResponse("Dashboard summary fetched successfully", summary);
  } catch (error) {
    console.error("Error fetching dashboard summary:", error);
    if (error instanceof z.ZodError) {
      return errorResponse("Invalid input", 400, "BAD_REQUEST", error.issues);
    }
    return errorResponse("Internal server error");
  }
};

export const GET = withAuth(getHandler);
