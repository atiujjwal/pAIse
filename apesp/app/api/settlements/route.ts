import { NextRequest } from "next/server";
import { Decimal } from "decimal.js";
import { z } from "zod";
import { prisma } from "@/src/lib/db";
import { withAuth } from "@/src/middleware/auth";

Decimal.set({ precision: 12 });

import {
  errorResponse,
  successResponse,
  notFound,
  badRequest,
  created,
} from "@/src/lib/response";

import { jobQueue } from "@/src/lib/queue";
import { createSettlementSchema } from "@/src/services/settlementServices";
import { checkGroupMembership } from "@/src/services/groupService";
import { formatPublicUser } from "@/src/lib/formatter";
import { balanceService } from "@/src/services/balanceService";

/**
 * POST /settlements
 * Records a manual payment (settlement) between two users.
 */
const postHandler = async (
  request: NextRequest,
  payload: { userId: string }
) => {
  try {
    const { userId: payerId } = payload;
    const body = await request.json();

    const parsedBody = createSettlementSchema.parse(body);
    const { receiver_id, group_id, amount, date } = parsedBody;

    if (payerId === receiver_id)
      return badRequest("Cannot settle with yourself");

    const receiver = await prisma.user.findUnique({
      where: { id: receiver_id, is_deleted: false },
    });

    if (!receiver) return notFound("Receiver not found");

    if (group_id) {
      const group = await prisma.group.findUnique({
        where: { id: group_id },
      });
      if (!group) return notFound("Group not found");

      await checkGroupMembership(payerId, group_id);
      await checkGroupMembership(receiver_id, group_id);
    }

    // Create settlement record
    const settlement = await prisma.settlement.create({
      data: {
        payer_id: payerId,
        receiver_id,
        group_id,
        amount: new Decimal(amount),
        date,
        currency: "INR",
      },
    });

    await balanceService.processSettlement(settlement.id);

    return created("Settlement recorded successfully", settlement);
  } catch (error: any) {
    console.log("Error creating settlement:", error);

    if (error instanceof z.ZodError) {
      return badRequest("Invalid input", error.issues);
    }

    if (error.message === "NOT_FOUND_OR_UNAUTHORIZED") {
      return errorResponse(
        "One or more users are not in the specified group",
        400
      );
    }

    return errorResponse("Internal server error");
  }
};

/**
 * GET /settlements
 * Retrieves a history of payments made or received by the user.
 */
const getHandler = async (
  request: NextRequest,
  payload: { userId: string }
) => {
  try {
    const { userId } = payload;
    const { searchParams } = new URL(request.url);

    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    const type = searchParams.get("type"); // paid / received

    let whereClause: any = {
      OR: [{ payer_id: userId }, { receiver_id: userId }],
    };

    if (type === "paid") whereClause = { payer_id: userId };
    if (type === "received") whereClause = { receiver_id: userId };

    const settlements = await prisma.settlement.findMany({
      where: whereClause,
      include: { payer: true, receiver: true }, // Include public user data
      take: limit,
      skip: offset,
      orderBy: { date: "desc" },
    });

    const formatted = settlements.map((s) => ({
      id: s.id,
      amount: s.amount,
      currency: s.currency,
      date: s.date,
      group_id: s.group_id,
      payer: formatPublicUser(s.payer),
      receiver: formatPublicUser(s.receiver),
    }));

    return successResponse("Settlements fetched successfully", {
      settlements: formatted,
    });
  } catch (error: any) {
    console.log("Error fetching settlements:", error);
    return errorResponse("Internal server error");
  }
};

export const POST = withAuth(postHandler);
export const GET = withAuth(getHandler);
