import { NextRequest } from "next/server";
import { Decimal } from "decimal.js";
import { z } from "zod";
import { prisma } from "@/src/lib/db";
import { withAuth } from "@/src/middleware/auth";

import {
  errorResponse,
  successResponse,
  notFound,
  badRequest,
  created,
} from "@/src/lib/response";

import { createSettlementSchema } from "@/src/services/settlementServices";
import { checkGroupMembership } from "@/src/services/groupService";
import { formatPublicUser } from "@/src/lib/formatter";
import { balanceService } from "@/src/services/balanceService";

Decimal.set({ precision: 12 });

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

    const decimalAmount = new Decimal(amount);
    if (decimalAmount.isNegative() || decimalAmount.isZero()) {
      return badRequest("Settlement amount must be positive");
    }

    const receiver = await prisma.user.findUnique({
      where: { id: receiver_id, is_deleted: false },
    });

    if (!receiver) return notFound("Receiver not found");

    if (group_id) {
      // --- FLOW A: GROUP SETTLEMENT ---
      const group = await prisma.group.findUnique({
        where: { id: group_id },
      });
      if (!group) return notFound("Group not found");

      await checkGroupMembership(payerId, group_id);
      await checkGroupMembership(receiver_id, group_id);
    } else {
      // --- FLOW B: FRIEND SETTLEMENT (Non-Group) ---
      const friendship = await prisma.friendship.findFirst({
        where: {
          OR: [
            { requester_id: payerId, addressee_id: receiver_id },
            { requester_id: receiver_id, addressee_id: payerId },
          ],
          status: "ACCEPTED",
        },
      });

      if (!friendship) {
        return badRequest(
          "You can only settle non-group expenses with accepted friends."
        );
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const settlement = await tx.settlement.create({
        data: {
          payer_id: payerId,
          receiver_id,
          group_id: group_id || null,
          amount: decimalAmount,
          date: new Date(date),
          currency: "INR",
        },
      });

      await balanceService.processSettlement(settlement.id, tx);
      return settlement;
    });

    return created("Settlement recorded successfully", result);
  } catch (error: any) {
    console.error("Error creating settlement:", error);
    if (error instanceof z.ZodError)
      return badRequest("Invalid input", error.issues);
    if (error.message === "NOT_FOUND_OR_UNAUTHORIZED")
      return errorResponse(
        "One or more users are not in the specified group",
        400
      );
    return errorResponse("Internal server error");
  }
};

/**
 * GET /settlements
 * Retrieves settlement history.
 * Supports filtering by:
 * - group_id: Returns ALL settlements in that group (Requires membership).
 * - friend_id: Returns 1:1 settlements between user and friend.
 * - (default): Returns ALL settlements involving the user.
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
    const group_id = searchParams.get("group_id");
    const friend_id = searchParams.get("friend_id");

    let whereClause: any = {};

    // --- CASE 1: GROUP HISTORY (Priority) ---
    if (group_id) {
      // Security: Must be a member to see group history
      try {
        await checkGroupMembership(userId, group_id);
      } catch (e) {
        return errorResponse("Group not found or unauthorized", 401);
      }

      whereClause = { group_id };

      // Optional: Filter within group
      if (type === "paid") whereClause.payer_id = userId;
      if (type === "received") whereClause.receiver_id = userId;
    }
    // --- CASE 2: FRIEND HISTORY (Private 1:1) ---
    else if (friend_id) {
      whereClause = {
        group_id: null, // Strictly private settlements (not part of a group trip)
        OR: [
          { payer_id: userId, receiver_id: friend_id },
          { payer_id: friend_id, receiver_id: userId },
        ],
      };

      // Refine if specific direction requested
      if (type === "paid") {
        whereClause = {
          group_id: null,
          payer_id: userId,
          receiver_id: friend_id,
        };
      } else if (type === "received") {
        whereClause = {
          group_id: null,
          payer_id: friend_id,
          receiver_id: userId,
        };
      }
    }
    // --- CASE 3: GENERAL DASHBOARD (All My Settlements) ---
    else {
      whereClause = {
        OR: [{ payer_id: userId }, { receiver_id: userId }],
      };

      if (type === "paid") whereClause = { payer_id: userId };
      if (type === "received") whereClause = { receiver_id: userId };
    }

    const settlements = await prisma.settlement.findMany({
      where: whereClause,
      include: { payer: true, receiver: true },
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
