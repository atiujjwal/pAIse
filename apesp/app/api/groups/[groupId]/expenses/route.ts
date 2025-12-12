import { NextRequest } from "next/server";
import { prisma } from "@/src/lib/db";
import { withAuth } from "@/src/middleware/auth";

import { checkGroupMembership } from "@/src/services/groupService";
import { errorResponse, successResponse } from "@/src/lib/response";
import { ExpenseStatus } from "@prisma/client";
import { formatPublicUser } from "@/src/lib/formatter";

/**
 * GET /groups/{groupId}/expenses
 * Lists all active expenses for a specific group.
 */
const getHandler = async (
  request: NextRequest,
  payload: { userId: string },
  context: { params: { groupId: string } }
) => {
  try {
    const { userId } = payload;
    const { groupId } = context.params;
    const { searchParams } = new URL(request.url);

    await checkGroupMembership(userId, groupId);

    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    const page = Math.floor(offset / limit) + 1;

    const whereClause = {
      group_id: groupId,
      status: ExpenseStatus.ACTIVE,
    };

    const [total, expenses] = await Promise.all([
      prisma.expense.count({ where: whereClause }),
      prisma.expense.findMany({
        where: whereClause,
        take: limit,
        skip: offset,
        orderBy: {
          date: "desc",
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

    const formattedExpenses = expenses.map((exp) => ({
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
    console.log("Error fetching expenses: ", error);

    if (error.message.includes("token")) return errorResponse("Unauthorized");
    if (error.message === "NOT_FOUND_OR_UNAUTHORIZED") {
      return errorResponse("Group not found or unauthorized");
    }
    return errorResponse("Internal server error");
  }
};

export const GET = withAuth(getHandler);
