import { NextRequest } from "next/server";
import { Decimal } from "decimal.js";
import { prisma } from "@/src/lib/db";
import {
  errorResponse,
  successResponse,
  unauthorized,
} from "@/src/lib/response";
import { withAuth } from "@/src/middleware/auth";

Decimal.set({ precision: 12 });

/**
 * GET /users/me/groups
 * Lists all groups the authenticated user is a member of.
 * Supports search and pagination.
 */
const getHandler = async (
  request: NextRequest,
  payload: { userId: string }
) => {
  try {
    const { userId } = payload;
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = Math.max(parseInt(searchParams.get("offset") || "0"), 0);
    const search = searchParams.get("search");

    const groupFilter = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { description: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const memberships = await prisma.groupMember.findMany({
      where: {
        user_id: userId,
        group: groupFilter,
      },
      include: {
        group: {
          include: {
            _count: {
              select: { members: true },
            },
            balances: {
              where: {
                OR: [{ user_A_id: userId }, { user_B_id: userId }],
              },
              select: {
                user_A_id: true,
                user_B_id: true,
                amount: true,
              },
            },
          },
        },
      },
      take: limit,
      skip: offset,
      orderBy: {
        group: {
          name: "asc",
        },
      },
    });


    const uniqueGroups = new Map();
    for (const mem of memberships) {
      const g = mem.group;
      if (uniqueGroups.has(g.id)) continue;
      let netBalance = new Decimal(0);
      for (const b of g.balances) {
        if (b.user_A_id === userId) {
          netBalance = netBalance.add(b.amount);
        } else if (b.user_B_id === userId) {
          netBalance = netBalance.sub(b.amount);
        }
      }

      const balanceVal = netBalance.toNumber();

      let status: "settled" | "owe" | "owed" = "settled";
      if (balanceVal < -0.01) status = "owe";
      else if (balanceVal > 0.01) status = "owed";

      uniqueGroups.set(g.id, {
        id: g.id,
        name: g.name,
        description: g.description,
        avatar: g.avatar,
        owner_id: g.owner_id,
        created_at: g.created_at,
        member_count: g._count.members,
        user_balance: netBalance.toFixed(2),
        user_status: status,
        has_debts: status === "owe",
        has_credits: status === "owed",
      });
    }

    return successResponse("Groups fetched successfully", {
      groups: Array.from(uniqueGroups.values()),
    });
  } catch (error: any) {
    console.error("Error getting groups:", error);
    return errorResponse("Internal server error");
  }
};

export const GET = withAuth(getHandler);
