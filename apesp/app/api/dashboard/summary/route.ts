import { NextRequest } from "next/server";
import { Decimal } from "decimal.js";

import { prisma } from "@/src/lib/db";
import { withAuth } from "@/src/middleware/auth";
import { errorResponse, successResponse } from "@/src/lib/response";
import { formatPublicUser } from "@/src/lib/formatter";

Decimal.set({ precision: 12 });

const getHandler = async (
  request: NextRequest,
  payload: { userId: string }
) => {
  try {
    const { userId } = payload;
    const now = new Date();
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
    let groupNetBalance = new Decimal(0);
    let friendNetBalance = new Decimal(0);

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

      if (b.group_id) {
        groupNetBalance = groupNetBalance.add(netChange);
      } else {
        friendNetBalance = friendNetBalance.add(netChange);
      }

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
          currency: "INR",
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
      group_net_balance: groupNetBalance.toFixed(2),
      friend_net_balance: friendNetBalance.toFixed(2),
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
    return errorResponse("Internal server error");
  }
};

export const GET = withAuth(getHandler);
