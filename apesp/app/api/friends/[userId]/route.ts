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
 */
const deleteHandler = async (
  request: NextRequest,
  payload: { userId: string },
  context: { params: { userId: string } }
) => {
  try {
    const { userId: myId } = payload;
    const { userId: friendId } = context.params;

    // Action: Find the Friendship record where status == ACCEPTED
    // and the two users are 'me' and '{userId}'.
    const friendship = await prisma.friendship.findFirst({
      where: {
        status: FriendshipStatus.ACCEPTED,
        OR: [
          { requester_id: myId, addressee_id: friendId },
          { requester_id: friendId, addressee_id: myId },
        ],
      },
    });

    // 404: Friendship not found. Idempotent: If not found, it's a success.
    if (!friendship) return notFound("Friendship not found");

    // Now, delete this friendship record.
    // We also delete any non-group balance between them.
    const [user_A_id, user_B_id] = [myId, friendId].sort();

    await prisma.$transaction([
      // Delete the friendship
      prisma.friendship.delete({
        where: { id: friendship.id },
      }),
      // Delete the non-group balance
      prisma.balance.deleteMany({
        where: {
          group_id: null,
          user_A_id: user_A_id,
          user_B_id: user_B_id,
        },
      }),
    ]);

    return noContent();
  } catch (error: any) {
    console.log("Error deleting friend: ", error);
    if (error.message.includes("token")) {
      return errorResponse("unauthorized");
    }
    // Handle case where record is already deleted
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
