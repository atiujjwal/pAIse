import { NextRequest } from "next/server";
import { z } from "zod";
import { Decimal } from "decimal.js";

import { prisma } from "@/src/lib/db";
import { withAuth } from "@/src/middleware/auth";

import { checkGroupMembership } from "@/src/services/groupService";
import {
  badRequest,
  created,
  errorResponse,
  forbidden,
  notFound,
} from "@/src/lib/response";
import { jobQueue } from "@/src/lib/queue";
import {
  ExpenseBodySchema,
  validateAndProcessExpense,
} from "@/src/services/expenseService";
import { balanceService } from "@/src/services/balanceService";

Decimal.set({ precision: 12 });

/**
 * POST /expenses
 * Creates a new expense, calculates splits, and triggers a balance update.
 * Supports both group expenses and friend-to-friend expenses.
 */
const postHandler = async (
  request: NextRequest,
  payload: { userId: string }
) => {
  try {
    const { userId } = payload;
    const body = await request.json();

    const parsedBody = ExpenseBodySchema.parse(body);

    let memberIds: Set<string>;
    let expenseGroupId: string | null = null;
    let friendId: string | null = null;

    if (parsedBody?.group_id) {
      expenseGroupId = parsedBody.group_id;
      await checkGroupMembership(userId, expenseGroupId);
      const members = await prisma.groupMember.findMany({
        where: { group_id: expenseGroupId },
        select: { user_id: true },
      });
      memberIds = new Set(members.map((m) => m.user_id));
    } else if (parsedBody?.friend_id) {
      friendId = parsedBody.friend_id;

      const [otherUser, friendship] = await Promise.all([
        prisma.user.findUnique({ where: { id: friendId } }),
        prisma.friendship.findFirst({
          where: {
            OR: [
              { requester_id: userId, addressee_id: friendId },
              { requester_id: friendId, addressee_id: userId },
            ],
            status: "ACCEPTED",
          },
        }),
      ]);

      if (!otherUser) return notFound("Friend user not found");
      if (!friendship) return forbidden("Users are not friends");

      // For friend expenses, only these two users can be involved
      memberIds = new Set([userId, friendId]);
    } else {
      return badRequest("Either group_id or friend_id must be provided");
    }

    const { payerData, splitData } = validateAndProcessExpense(
      parsedBody,
      memberIds
    );

    if (expenseGroupId) parsedBody["group_id"] = expenseGroupId;
    if (friendId) parsedBody.friend_id = friendId;

    // Create records in a single database transaction
    const newExpense = await prisma.$transaction(async (tx) => {
      // Create the main Expense record
      const expense = await tx.expense.create({
        data: {
          group_id: expenseGroupId ? expenseGroupId : null,
          friend_id: friendId ? friendId : null,
          created_by_id: userId,
          description: parsedBody.description,
          amount: new Decimal(parsedBody.amount),
          split_type: parsedBody.split_type,
          currency: parsedBody.currency || "INR",
          category: parsedBody.category,
          date: parsedBody.date,
          receipt_url: parsedBody.receipt_url,
          status: "ACTIVE",
        },
      });

      // Create related ExpensePayer records
      await tx.expensePayer.createMany({
        data: payerData.map((p) => ({
          expense_id: expense.id,
          user_id: p.user_id,
          amount: p.amount,
        })),
      });

      // Create related ExpenseSplit records
      await tx.expenseSplit.createMany({
        data: splitData.map((s) => ({
          expense_id: expense.id,
          user_id: s.user_id,
          amount_owed: s.amount_owed,
          percent_owed: s.percent_owed,
          shares_owed: s.shares_owed,
        })),
      });

      return expense;
    });

    await balanceService.updateBalanceFromExpense(newExpense.id);

    const completeExpense = await prisma.expense.findUnique({
      where: { id: newExpense.id },
      include: {
        payers: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        splits: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        group: { select: { id: true, name: true } },
      },
    });

    return created("Expense created successfully", completeExpense);
  } catch (error: any) {
    console.log("Error creating expense: ", error);

    if (error instanceof z.ZodError) {
      return errorResponse("Invalid input", 400, "BAD_REQUEST", error.issues);
    }

    if (error.message.includes("token")) {
      return errorResponse("Unauthorized");
    }

    if (error.message === "NOT_FOUND_OR_UNAUTHORIZED") {
      return errorResponse("Group not found or unauthorized");
    }

    if (
      error.message.includes("sum") ||
      error.message.includes("is not in the group")
    ) {
      return errorResponse(error.message, 400);
    }

    if (error.message.includes("not friends")) {
      return errorResponse("Users are not friends", 403, "FORBIDDEN");
    }

    return errorResponse("Internal server error");
  }
};

export const POST = withAuth(postHandler);
