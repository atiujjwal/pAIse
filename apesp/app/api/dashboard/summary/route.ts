import { NextRequest } from "next/server";
import { z } from "zod";
import { Decimal } from "decimal.js";

import { prisma } from "@/src/lib/db";
import { withAuth } from "@/src/middleware/auth";
import { errorResponse, successResponse } from "@/src/lib/response";
import { formatPublicUser } from "@/src/lib/formatter";

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

    const rawBalances = await prisma.balance.findMany({
      where: {
        OR: [{ user_A_id: userId }, { user_B_id: userId }],
      },
      include: {
        user_a: true,
        user_b: true,
      },
    });

    let totalBalance = new Decimal(0);
    const netBalanceMap = new Map<string, Decimal>();
    const userMap = new Map<string, any>();

    for (const b of rawBalances) {
      const isUserA = b.user_A_id === userId;
      const otherUser = isUserA ? b.user_b : b.user_a;
      const otherUserId = otherUser.id;

      if (!userMap.has(otherUserId)) {
        userMap.set(otherUserId, formatPublicUser(otherUser));
      }

      let netChange: Decimal;
      if (isUserA) {
        netChange = b.amount;
      } else {
        netChange = b.amount.negated();
      }

      totalBalance = totalBalance.add(netChange);
      const currentFriendNet = netBalanceMap.get(otherUserId) || new Decimal(0);
      netBalanceMap.set(otherUserId, currentFriendNet.add(netChange));
    }

    const you_owe: any[] = [];
    const you_are_owed: any[] = [];

    for (const [friendId, net] of netBalanceMap.entries()) {
      const balanceVal = net.toNumber();
      if (Math.abs(balanceVal) < 0.01) continue;

      const friendDetails = userMap.get(friendId);
      let status: "owe" | "owed" | "settled" = "settled";

      if (balanceVal < 0) {
        status = "owe";
        you_owe.push({
          ...friendDetails,
          net_balance: net.abs().toFixed(2),
          status,
          currency: "INR", // TODO: Fetch from preferences if needed
        });
      } else {
        status = "owed";
        you_are_owed.push({
          ...friendDetails,
          net_balance: net.abs().toFixed(2),
          status,
          currency: "INR",
        });
      }
    }

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

    let budgetUsedPercent = 0;
    if (!budgetLimit.isZero()) {
      budgetUsedPercent = totalSpent
        .div(budgetLimit)
        .mul(100)
        .toDecimalPlaces(1)
        .toNumber();
    } else if (totalSpent.gt(0)) {
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

    const recentExpensesRaw = await prisma.expense.findMany({
      where: {
        status: "ACTIVE",
        OR: [
          { created_by_id: userId },
          { payers: { some: { user_id: userId } } }, // I paid
          { splits: { some: { user_id: userId } } }, // OR I owe
        ],
      },
      orderBy: { date: "desc" },
      take: 5,
      include: {
        group: {
          select: { id: true, name: true, avatar: true },
        },
        created_by: {
          select: { id: true, name: true, avatar: true },
        },
        payers: {
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
        },
        splits: {
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
        },
      },
    });

    const recentExpenses = recentExpensesRaw.map((exp) => ({
      id: exp.id,
      description: exp.description,
      amount: exp.amount,
      currency: exp.currency,
      date: exp.date,
      category: exp.category,
      receipt_url: exp.receipt_url,
      split_type: exp.split_type,
      group: exp.group
        ? { id: exp.group.id, name: exp.group.name, avatar: exp.group.avatar }
        : null,
      created_by: formatPublicUser(exp.created_by!),
      payers: exp.payers.map((p) => ({
        user: formatPublicUser(p.user),
        amount: p.amount,
      })),
      splits: exp.splits.map((s) => ({
        user: formatPublicUser(s.user),
        amount_owed: s.amount_owed,
      })),
    }));

    const summary = {
      total_balance: totalBalance.toFixed(2),
      monthly_metrics: {
        total_spent: totalSpent.toNumber(),
        budget_limit: budgetLimit.toNumber(),
        remaining: remainingBudget.toNumber(),
        budget_used_percent: budgetUsedPercent,
      },
      upcoming_subscriptions: upcomingSubscriptions.map((sub) => ({
        id: sub.id,
        name: sub.name,
        amount: sub.amount.toNumber(),
        next_charge_date: sub.next_charge_date,
      })),
      recent_expenses: recentExpenses,
      you_owe,
      you_are_owed,
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
