import { NextRequest } from "next/server";
import { Decimal } from "decimal.js";
import { z } from "zod";

Decimal.set({ precision: 12 });

import { GroupRole, SplitType } from "@prisma/client";
import { prisma } from "@/src/lib/db";
import { withAuth } from "@/src/middleware/auth";
import { checkGroupMembership } from "@/src/services/groupService";
import {
  errorResponse,
  notFound,
  successResponse,
  noContent,
  forbidden,
  badRequest,
} from "@/src/lib/response";
import { formatDetailedExpense } from "@/src/lib/formatter";
import {
  ExpenseBodySchema,
  UpdateExpenseSchema,
  validateAndProcessExpense,
} from "@/src/services/expenseService";
import { balanceService } from "@/src/services/balanceService";

/**
 * GET /expenses/{expenseId}
 * Retrieves a single expense in full detail.
 */
const getHandler = async (
  request: NextRequest,
  payload: { userId: string },
  context: { params: { expenseId: string } }
) => {
  try {
    const { userId } = payload;
    const { expenseId } = context.params;

    const expense = await prisma.expense.findUnique({
      where: { id: expenseId },
      include: {
        created_by: true,
        payers: { include: { user: true } },
        splits: { include: { user: true } },
      },
    });

    if (!expense) return notFound("Expense not found");

    let expenseGroupId: string | null = null;
    let friendId: string | null = null;

    if (expense?.group_id) {
      expenseGroupId = expense.group_id;
      //401: Unauthorized (User is not part of the group)
      await checkGroupMembership(userId, expenseGroupId);
    } else if (expense?.friend_id) {
      friendId = expense.friend_id;
      const friendship = await prisma.friendship.findFirst({
        where: {
          OR: [
            { requester_id: userId, addressee_id: friendId },
            { requester_id: friendId, addressee_id: userId },
          ],
          status: "ACCEPTED",
        },
      });
      if (!friendship) return forbidden("Users are not friends");
    }

    return successResponse(
      "Expense fetched successfully",
      formatDetailedExpense(expense)
    );
  } catch (error: any) {
    console.log("Error fetching expense:", error);
    if (error.message.includes("token")) return errorResponse("Unauthorized");
    if (error.message === "NOT_FOUND_OR_UNAUTHORIZED") {
      return errorResponse("Expense not found or unauthorized");
    }
    return errorResponse("Internal server error");
  }
};

/**
 * PUT /expenses/{expenseId}
 * Updates an existing expense following the new POST flow.
 * Supports both group expenses and friend-to-friend expenses.
 */
const putHandler = async (
  request: NextRequest,
  payload: { userId: string },
  context: { params: { expenseId: string } }
) => {
  try {
    const { userId } = payload;
    const { expenseId } = context.params;
    const body = await request.json();

    const parsedBody = UpdateExpenseSchema.parse(body);

    const existing = await prisma.expense.findUnique({
      where: { id: expenseId },
      include: {
        payers: true,
        splits: true,
      },
    });

    if (!existing) return notFound("Expense");

    if (existing.group_id && parsedBody.friend_id && !parsedBody.group_id)
      return badRequest("Cannot convert a group expense to friend expense");

    if (existing.friend_id && parsedBody.group_id && !parsedBody.friend_id)
      return badRequest("Cannot convert a friend expense to group expense");

    if (
      existing.group_id &&
      parsedBody.group_id &&
      parsedBody.group_id !== existing.group_id
    )
      return badRequest("Group ID cannot be changed");

    if (
      existing.friend_id &&
      parsedBody.friend_id &&
      parsedBody.friend_id !== existing.friend_id
    )
      return badRequest("Friend ID cannot be changed");

    let memberIds: Set<string> | undefined;

    if (existing.group_id) {
      await checkGroupMembership(userId, existing.group_id);

      const members = await prisma.groupMember.findMany({
        where: { group_id: existing.group_id },
        select: { user_id: true },
      });

      memberIds = new Set(members.map((m) => m.user_id));
    } else if (existing.friend_id) {
      const isCreator = existing.created_by_id === userId;
      const isTheFriend = existing.friend_id === userId;

      if (!isCreator && !isTheFriend) {
        return forbidden("You are not a participant in this friend expense");
      }

      // Determine who the other person is for the memberIds set
      const otherPersonId = isCreator
        ? existing.friend_id
        : existing.created_by_id;

      const friendship = await prisma.friendship.findFirst({
        where: {
          OR: [
            { requester_id: userId, addressee_id: otherPersonId },
            { requester_id: otherPersonId, addressee_id: userId },
          ],
          status: "ACCEPTED",
        },
      });

      if (!friendship) return forbidden("Friendship no longer exists");

      memberIds = new Set([userId, otherPersonId]);
    } else {
      return errorResponse(
        "Invalid expense state: No group or friend associated"
      );
    }

    if (!memberIds) {
      return errorResponse(
        "Invalid expense: missing group or friend participants"
      );
    }

    const mergedData = {
      group_id: existing.group_id,
      friend_id: existing.friend_id,
      description: parsedBody.description ?? existing.description,
      currency: parsedBody.currency ?? existing.currency,
      category: parsedBody.category ?? existing.category,
      date: parsedBody.date ?? existing.date.toISOString(),
      receipt_url: parsedBody.receipt_url ?? existing.receipt_url,
      amount: parsedBody.amount ?? existing.amount.toString(),
      payers:
        parsedBody.payers ??
        existing.payers.map((p) => ({
          user_id: p.user_id,
          amount: p.amount.toString(),
        })),
      split_type:
        parsedBody.split_type ?? (existing as any).split_type ?? "EQUAL",
      splits:
        parsedBody.splits ??
        existing.splits.map((s) => ({
          user_id: s.user_id,
          amount_owed: s.amount_owed?.toString(),
          percent_owed: s.percent_owed ?? undefined,
          shares_owed: s.shares_owed ?? undefined,
        })),
    };

    const validFullBody = ExpenseBodySchema.parse(mergedData);

    const { payerData, splitData } = validateAndProcessExpense(
      validFullBody,
      memberIds
    );

    // Perform UPDATE (transaction)
    await prisma.$transaction(async (tx) => {
      await tx.expensePayer.deleteMany({ where: { expense_id: expenseId } });
      await tx.expenseSplit.deleteMany({ where: { expense_id: expenseId } });

      // Update main expense
      const expense = await tx.expense.update({
        where: { id: expenseId },
        data: {
          description: parsedBody.description,
          amount: new Decimal(validFullBody.amount),
          currency: parsedBody.currency || "INR",
          category: parsedBody.category,
          date: parsedBody.date,
          receipt_url: parsedBody.receipt_url,
          split_type: validFullBody.split_type,
        },
      });

      // Insert payers again
      await tx.expensePayer.createMany({
        data: payerData.map((p) => ({
          expense_id: expense.id,
          user_id: p.user_id,
          amount: p.amount,
        })),
      });

      // Insert splits again
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

    if (existing) await balanceService.editExpenseImpact(existing, existing.id);

    const completeExpense = await prisma.expense.findUnique({
      where: { id: expenseId },
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

    return successResponse("Expense updated successfully", completeExpense);
  } catch (error: any) {
    console.log("Error updating expense:", error);

    if (error instanceof z.ZodError)
      return errorResponse("Invalid input", 400, "BAD_REQUEST", error.issues);

    if (error.message.includes("token")) return errorResponse("Unauthorized");

    if (
      error.message.includes("sum") ||
      error.message.includes("is not in the group")
    )
      return errorResponse(error.message, 400);

    return errorResponse("Internal server error");
  }
};

/**
 * DELETE /expenses/{expenseId}
 * Deletes an expense.
 */
const deleteHandler = async (
  request: NextRequest,
  payload: { userId: string },
  context: { params: { expenseId: string } }
) => {
  try {
    const { userId } = payload;
    const { expenseId } = context.params;

    const expense = await prisma.expense.findUnique({
      where: { id: expenseId },
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

    if (!expense) return notFound("Expense");

    if (expense.group_id) {
      const membership = await checkGroupMembership(userId, expense.group_id);

      if (
        expense.created_by_id !== userId &&
        membership.role !== GroupRole.ADMIN
      ) {
        return forbidden("Only creator or admin can delete this expense");
      }
    }

    if (expense?.friend_id) {
      const friendId = expense.friend_id;
      if (expense.created_by_id !== userId && friendId !== userId) {
        return forbidden("You are not allowed to delete this friend expense");
      }
    }

    await prisma.expense.delete({
      where: { id: expenseId },
    });

    if (expense) {
      balanceService.revertExpenseImpact({
        id: expense.id,
        group_id: expense.group_id || null,
        friend_id: expense.friend_id || null,
        payers: expense.payers.map((payer) => ({
          user_id: payer.user_id,
          amount: payer.amount,
        })),
        splits: expense.splits.map((split) => ({
          user_id: split.user_id,
          amount_owed: split.amount_owed,
        })),
      });
    }

    return noContent();
  } catch (error: any) {
    console.log("Error deleting expense:", error);
    if (error.message.includes("token")) return errorResponse("Unauthorized");

    if (error.message === "NOT_FOUND_OR_UNAUTHORIZED")
      return errorResponse("Expense not found or unauthorized");

    return errorResponse("Internal server error");
  }
};

export const GET = withAuth(getHandler);
export const PUT = withAuth(putHandler);
export const DELETE = withAuth(deleteHandler);
