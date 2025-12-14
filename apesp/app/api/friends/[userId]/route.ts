import { NextRequest } from "next/server";
import { prisma } from "@/src/lib/db";
import { ExpenseStatus, FriendshipStatus } from "@prisma/client";
import { withAuth } from "@/src/middleware/auth";
import { Decimal } from "decimal.js";
import {
  errorResponse,
  noContent,
  notFound,
  successResponse,
} from "@/src/lib/response";
import { formatPublicUser } from "@/src/lib/formatter";

Decimal.set({ precision: 12 });

/**
 * Helper to format expense list to match global /expenses API
 */
const formatExpenseList = (expenses: any[]) => {
  return expenses.map((exp) => ({
    id: exp.id,
    description: exp.description,
    amount: exp.amount,
    currency: exp.currency,
    date: exp.date,
    category: exp.category,
    receipt_url: exp.receipt_url,
    split_type: exp.split_type,
    status: exp.status,
    created_at: exp.created_at,

    // Context Info
    group: exp.group
      ? { id: exp.group.id, name: exp.group.name, avatar: exp.group.avatar }
      : null,
    created_by: formatPublicUser(exp.created_by),

    // Details
    payers: exp.payers.map((p: any) => ({
      user: formatPublicUser(p.user),
      amount: p.amount,
    })),
    splits: exp.splits.map((s: any) => ({
      user: formatPublicUser(s.user),
      amount_owed: s.amount_owed,
    })),
  }));
};

/**
 * DELETE /friends/{userId}
 * Removes a friend ("unfriends" a user) by their user ID.
 * VALIDATION: Returns detailed list of groups with pending balances if removal is blocked.
 */
const deleteHandler = async (
  request: NextRequest,
  payload: { userId: string },
  context: { params: { userId: string } }
) => {
  try {
    const { userId: myId } = payload;
    const { userId: friendId } = context.params;

    // Find the Friendship record
    const friendship = await prisma.friendship.findFirst({
      where: {
        status: FriendshipStatus.ACCEPTED,
        OR: [
          { requester_id: myId, addressee_id: friendId },
          { requester_id: friendId, addressee_id: myId },
        ],
      },
    });

    if (!friendship) return notFound("Friendship not found");

    const [user_A_id, user_B_id] = [myId, friendId].sort();

    // Fetch all group balances between these two users
    const groupBalances = await prisma.balance.findMany({
      where: {
        user_A_id,
        user_B_id,
        group_id: { not: null },
      },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    const pendingGroups = [];

    // Analyze balances to see if any are non-zero
    for (const b of groupBalances) {
      if (!b.group) continue;

      let netBalance = new Decimal(0);

      if (b.user_A_id === myId) {
        // I am A. +Amount = Credit, -Amount = Debt
        netBalance = b.amount;
      } else {
        // I am B. -Amount = Credit, +Amount = Debt
        netBalance = b.amount.negated();
      }

      // Check if significant debt exists
      if (Math.abs(netBalance.toNumber()) > 0.01) {
        pendingGroups.push({
          id: b.group.id,
          name: b.group.name,
          avatar: b.group.avatar,
          pending_balance: netBalance.toFixed(2), // + means they owe me, - means I owe them
          status: netBalance.isPositive() ? "owed" : "owe",
        });
      }
    }

    // 4. Return Conflict if pending balances exist
    if (pendingGroups.length > 0) {
      return Response.json(
        {
          success: false,
          message: "Cannot remove friend due to pending group balances.",
          code: "PENDING_GROUP_BALANCES",
          data: {
            groups: pendingGroups,
          },
        },
        { status: 400 }
      );
    }

    // Clean Delete if safe
    await prisma.$transaction([
      prisma.friendship.delete({
        where: { id: friendship.id },
      }),
      // Delete the non-group balance
      prisma.balance.deleteMany({
        where: {
          group_id: null,
          user_A_id,
          user_B_id,
        },
      }),
    ]);

    return noContent();
  } catch (error: any) {
    console.error("Error deleting friend: ", error);
    if (error.message?.includes("token")) {
      return errorResponse("Unauthorized", 401);
    }
    if (error.code === "P2025") {
      return noContent();
    }
    return errorResponse("Internal server error");
  }
};

/**
 * GET /friends/[userId]
 * Fetches detailed profile of a friend, including:
 * 1. Basic Profile Info
 * 2. Net Balance (Aggregated across all groups and direct expenses)
 * 3. Shared Expense Lists (Separated by Friend vs Group expenses)
 */
const getHandler = async (
  request: NextRequest,
  payload: { userId: string },
  context: { params: { userId: string } }
) => {
  try {
    const { userId: myId } = payload;
    const { userId: friendId } = context.params;

    const friendship = await prisma.friendship.findFirst({
      where: {
        status: FriendshipStatus.ACCEPTED,
        OR: [
          { requester_id: myId, addressee_id: friendId },
          { requester_id: friendId, addressee_id: myId },
        ],
      },
    });

    if (!friendship) {
      return notFound("Friendship not found or not active");
    }

    const friendUser = await prisma.user.findUnique({
      where: { id: friendId, is_deleted: false },
    });

    if (!friendUser) return notFound("User not found");

    // Calculate Net Balance
    const balances = await prisma.balance.findMany({
      where: {
        OR: [
          { user_A_id: myId, user_B_id: friendId },
          { user_A_id: friendId, user_B_id: myId },
        ],
      },
    });

    let netBalance = new Decimal(0);

    for (const b of balances) {
      if (b.user_A_id === myId) netBalance = netBalance.add(b.amount);
      else netBalance = netBalance.sub(b.amount);
    }

    const balanceVal = netBalance.toNumber();
    let status: "settled" | "owe" | "owed" = "settled";

    if (balanceVal < -0.01) status = "owe";
    else if (balanceVal > 0.01) status = "owed";

    const baseExpenseFilter = {
      status: ExpenseStatus.ACTIVE,
      AND: [
        {
          OR: [
            { payers: { some: { user_id: myId } } },
            { splits: { some: { user_id: myId } } },
          ],
        },
        {
          OR: [
            { payers: { some: { user_id: friendId } } },
            { splits: { some: { user_id: friendId } } },
          ],
        },
      ],
    };

    const expenseSelect = {
      id: true,
      description: true,
      amount: true,
      currency: true,
      category: true,
      date: true,
      status: true,
      created_at: true,
      receipt_url: true,
      split_type: true,
      group_id: true,
      created_by: {
        select: { id: true, name: true, avatar: true },
      },
      payers: {
        select: {
          amount: true,
          user: { select: { id: true, name: true, avatar: true } },
        },
      },
      splits: {
        select: {
          amount_owed: true,
          user: { select: { id: true, name: true, avatar: true } },
        },
      },
    };

    const [friendExpenses, groupExpenses] = await Promise.all([
      // Friend (Direct) Expenses -> group_id is null
      prisma.expense.findMany({
        where: {
          ...baseExpenseFilter,
          group_id: null,
        },
        orderBy: { date: "desc" },
        select: expenseSelect,
      }),
      // Group Expenses -> group_id is NOT null
      prisma.expense.findMany({
        where: {
          ...baseExpenseFilter,
          group_id: { not: null },
        },
        orderBy: { date: "desc" },
        select: {
          ...expenseSelect,
          group: {
            select: { id: true, name: true, avatar: true },
          },
        },
      }),
    ]);

    return successResponse("Friend details fetched successfully", {
      ...formatPublicUser(friendUser),
      net_balance: netBalance.abs().toFixed(2),
      status, // "owe" | "owed" | "settled"
      currency: "INR",
      expenses: {
        friend_expenses: formatExpenseList(friendExpenses),
        group_expenses: formatExpenseList(groupExpenses),
      },
    });
  } catch (error: any) {
    console.error("Error getting friend details: ", error);
    if (error.message?.includes("token")) {
      return errorResponse("Unauthorized", 401);
    }
    return errorResponse("Internal server error");
  }
};

export const GET = withAuth(getHandler);
export const DELETE = withAuth(deleteHandler);
