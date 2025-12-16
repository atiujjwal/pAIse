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
  successResponse,
} from "@/src/lib/response";
import { jobQueue } from "@/src/lib/queue";
import {
  ExpenseBodySchema,
  GetExpensesQuerySchema,
  validateAndProcessExpense,
} from "@/src/services/expenseService";
import { balanceService } from "@/src/services/balanceService";
import { formatPublicUser } from "@/src/lib/formatter";
import { NotificationType, Prisma } from "@prisma/client";
import { sendEmail } from "@/src/services/messageServices";

Decimal.set({ precision: 12 });

const notifyParticipants = async (
  memberIds: Set<string>,
  creatorId: string,
  creatorName: string,
  isGroupExpense: boolean,
  description: string,
  totalAmount: string,
  expenseWith: string,
  dashboardLink: string
) => {
  const recipients = Array.from(memberIds).filter((id) => id !== creatorId);

  await Promise.all(
    recipients.map(async (memberId) => {
      const member = await prisma.user.findUnique({
        where: { id: memberId },
        select: { email: true, name: true },
      });

      if (!member?.email) return;

      const title = isGroupExpense
        ? `${creatorName} added a group expense`
        : `${creatorName} added an expense with you`;

      const year = new Date().getFullYear();
      let emailData = {
        to: member.email,
        templateId: 7,
        data: {
          recipientName: member.name,
          creatorName,
          description,
          totalAmount,
          expenseWith,
          dashboardLink,
          year,
        },
        notificationData: {
          recipientId: memberId,
          type: "EXPENSE_ADDED" as NotificationType,
          title,
          message: "Feel free to settle your pAIse with your friends.",
        },
      };
      sendEmail(emailData);
    })
  );
};

/**
 * POST /expenses
 * Creates a new expense, calculates splits, and triggers a balance update.
 * Supports both group expenses and friend-to-friend expenses.
 */
const postHandler = async (
  request: NextRequest,
  payload: { userId: string; name: string }
) => {
  try {
    const { userId, name } = payload;
    const body = await request.json();

    const parsedBody = ExpenseBodySchema.parse(body);

    let memberIds: Set<string>;
    let expenseGroupId: string | null = null;
    let friendId: string | null = null;
    let groupName = "";
    let friendName = "";

    if (parsedBody?.group_id) {
      expenseGroupId = parsedBody.group_id;
      await checkGroupMembership(userId, expenseGroupId);
      const [members, group] = await Promise.all([
        prisma.groupMember.findMany({
          where: { group_id: expenseGroupId },
          select: { user_id: true },
        }),
        prisma.group.findUnique({
          where: { id: expenseGroupId },
          select: { name: true },
        }),
      ]);
      groupName = group?.name!;
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
      friendName = otherUser?.name!;

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

    let expenseWith = groupName ? `in ${groupName}` : `with ${friendName}`;

    notifyParticipants(
      memberIds,
      userId,
      name,
      !!expenseGroupId,
      parsedBody.description,
      parsedBody.amount,
      expenseWith,
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/expenses/${newExpense.id}`
    );

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

    if (error.message.includes("token")) return errorResponse("Unauthorized");

    if (error.message === "NOT_FOUND_OR_UNAUTHORIZED")
      return errorResponse("Group not found or unauthorized");

    if (
      error.message.includes("sum") ||
      error.message.includes("is not in the group")
    )
      return errorResponse(error.message, 400);

    if (error.message.includes("not friends"))
      return forbidden("Users are not friends");

    return errorResponse("Internal server error");
  }
};

/**
 * GET /expenses
 * Retrieves expenses with pagination, filtering, and search.
 * Context-aware:
 * - If group_id provided: Returns expenses for that group.
 * - If friend_id provided: Returns expenses between user and friend.
 * - Global: Returns all expenses involving the user.
 * - Filter: expense_type ('friend', 'group', 'all')
 */
const getHandler = async (
  request: NextRequest,
  payload: { userId: string }
) => {
  try {
    const { userId } = payload;

    // Parse Query Parameters
    const { searchParams } = new URL(request.url);
    const rawQuery = Object.fromEntries(searchParams.entries());

    const expense_type = searchParams.get("expense_type"); // 'friend' | 'group' | 'all'

    const query = GetExpensesQuerySchema.safeParse(rawQuery);

    if (!query.success) {
      return badRequest("Invalid query parameters", query.error.issues);
    }

    const {
      page,
      limit,
      search,
      group_id,
      friend_id,
      category,
      from_date,
      to_date,
      min_amount,
      max_amount,
      sort_by = "created_at",
      sort_order = "desc",
    } = query.data;

    // Build the 'Where' Clause
    const whereClause: Prisma.ExpenseWhereInput = {
      status: "ACTIVE",
    };

    if (group_id) {
      const membership = await prisma.groupMember.findUnique({
        where: {
          group_id_user_id: { group_id, user_id: userId },
        },
      });

      if (!membership) {
        return errorResponse(
          "You are not a member of this group",
          403,
          "FORBIDDEN"
        );
      }

      whereClause.group_id = group_id;
    } else if (friend_id) {
      whereClause.group_id = null;
      whereClause.OR = [
        { created_by_id: userId, friend_id: friend_id },
        { created_by_id: friend_id, friend_id: userId },
      ];
    } else {
      whereClause.OR = [
        { created_by_id: userId },
        { payers: { some: { user_id: userId } } },
        { splits: { some: { user_id: userId } } },
      ];

      if (expense_type === "friend") {
        whereClause.group_id = null;
      } else if (expense_type === "group") {
        whereClause.group_id = { not: null };
      }
      // Default is 'all', so we don't add restrictions otherwise
    }

    // --- Filter Logic ---

    if (category) {
      whereClause.category = category;
    }

    if (from_date || to_date) {
      whereClause.date = {};
      if (from_date) whereClause.date.gte = from_date;
      if (to_date) whereClause.date.lte = to_date;
    }

    if (min_amount || max_amount) {
      whereClause.amount = {};
      if (min_amount) whereClause.amount.gte = min_amount;
      if (max_amount) whereClause.amount.lte = max_amount;
    }

    if (search) {
      whereClause.description = {
        contains: search,
        mode: "insensitive",
      };
    }

    // Execute Queries (Data + Count)
    const skip = (page - 1) * limit;

    const [total, expenses] = await Promise.all([
      prisma.expense.count({ where: whereClause }),
      prisma.expense.findMany({
        where: whereClause,
        take: limit,
        skip: skip,
        orderBy: {
          [sort_by]: sort_order,
        },
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
      }),
    ]);

    // 4. Format Response
    const formattedExpenses = expenses.map((exp) => ({
      id: exp.id,
      description: exp.description,
      amount: exp.amount,
      currency: exp.currency,
      date: exp.date,
      category: exp.category,
      receipt_url: exp.receipt_url,
      split_type: exp.split_type,

      // Context Info
      group: exp.group
        ? { id: exp.group.id, name: exp.group.name, avatar: exp.group.avatar }
        : null,
      created_by: formatPublicUser(exp.created_by!),

      // Details
      payers: exp.payers.map((p) => ({
        user: formatPublicUser(p.user),
        amount: p.amount,
      })),
      splits: exp.splits.map((s) => ({
        user: formatPublicUser(s.user),
        amount_owed: s.amount_owed,
      })),
    }));

    // Pagination Metadata
    const totalPages = Math.ceil(total / limit);
    const meta = {
      total_items: total,
      total_pages: totalPages,
      current_page: page,
      limit: limit,
    };

    return successResponse("Expenses fetched successfully", {
      data: formattedExpenses,
      meta,
    });
  } catch (error: any) {
    console.error("Error fetching expenses:", error);

    if (error.message.includes("token")) {
      return errorResponse("Unauthorized", 401);
    }

    return errorResponse("Internal server error");
  }
};

export const GET = withAuth(getHandler);

export const POST = withAuth(postHandler);
