import { NextRequest } from "next/server";
import { Decimal } from "decimal.js";
import { FriendshipStatus, Prisma } from "@prisma/client";
import { prisma } from "@/src/lib/db";
import { formatPublicUser } from "@/src/lib/formatter";
import {
  errorResponse,
  successResponse,
  unauthorized,
} from "@/src/lib/response";
import { withAuth } from "@/src/middleware/auth";

Decimal.set({ precision: 12 });

/**
 * GET /friends
 * Lists all accepted friends of the authenticated user.
 * Supports filtering by friend's name via ?search=...
 * Supports sorting by balance via ?sort_by=balance&sort_order=asc/desc
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
    const sortBy = searchParams.get("sort_by"); // 'balance' or 'status'
    const sortOrder = searchParams.get("sort_order") === "asc" ? "asc" : "desc";


    const whereClause: Prisma.FriendshipWhereInput = {
      status: FriendshipStatus.ACCEPTED,
    };

    if (search) {
      whereClause.OR = [
        {
          requester_id: userId,
          addressee: {
            name: { contains: search, mode: "insensitive" },
          },
        },
        {
          addressee_id: userId,
          requester: {
            name: { contains: search, mode: "insensitive" },
          },
        },
      ];
    } else {
      whereClause.OR = [{ requester_id: userId }, { addressee_id: userId }];
    }

    const allFriendships = await prisma.friendship.findMany({
      where: whereClause,
      include: {
        requester: true,
        addressee: true,
      },
      orderBy: {
        updated_at: "desc",
      },
    });

    if (allFriendships.length === 0) {
      return successResponse("Friends fetched successfully", { friends: [] });
    }

    const friendIds: string[] = [];
    const friendMap = new Map<string, any>();

    const friendsList = allFriendships.map((f) => {
      const isRequesterMe = f.requester_id === userId;
      const friendUser = isRequesterMe ? f.addressee : f.requester;
      friendIds.push(friendUser.id);
      const formatted = formatPublicUser(friendUser);
      friendMap.set(friendUser.id, formatted);
      return formatted;
    });

    const balances = await prisma.balance.findMany({
      where: {
        OR: [
          { user_A_id: userId, user_B_id: { in: friendIds } },
          { user_B_id: userId, user_A_id: { in: friendIds } },
        ],
      },
      select: {
        user_A_id: true,
        user_B_id: true,
        amount: true,
      },
    });

    const balanceMap = new Map<string, Decimal>();

    for (const b of balances) {
      const otherId = b.user_A_id === userId ? b.user_B_id : b.user_A_id;
      const currentNet = balanceMap.get(otherId) || new Decimal(0);

      if (b.user_A_id === userId) {
        balanceMap.set(otherId, currentNet.add(b.amount));
      } else {
        balanceMap.set(otherId, currentNet.sub(b.amount));
      }
    }

    let enrichedFriends = friendsList.map((friend) => {
      const netBalance = balanceMap.get(friend?.id!) || new Decimal(0);
      const balanceVal = netBalance.toNumber();

      let status: "settled" | "owe" | "owed" = "settled";
      if (balanceVal < -0.01) status = "owe";
      else if (balanceVal > 0.01) status = "owed";

      return {
        ...friend,
        net_balance: netBalance.abs().toFixed(2),
        raw_balance: balanceVal,
        status: status, // "owe" | "owed" | "settled"
        currency: "INR",
      };
    });

    if (sortBy === "balance") {
      enrichedFriends.sort((a, b) => {
        const valA = Math.abs(a.raw_balance);
        const valB = Math.abs(b.raw_balance);
        return sortOrder === "asc" ? valA - valB : valB - valA;
      });
    } else if (sortBy === "status") {
      enrichedFriends.sort((a, b) => {
        return sortOrder === "asc"
          ? a.raw_balance - b.raw_balance
          : b.raw_balance - a.raw_balance;
      });
    }

    const paginatedFriends = enrichedFriends.slice(offset, offset + limit);

    const sanitizedFriends = paginatedFriends.map(
      ({ raw_balance, ...rest }) => rest
    );

    return successResponse("Friends fetched successfully", {
      friends: sanitizedFriends,
    });
  } catch (error: any) {
    console.error("Error fetching friends list:", error);
    if (error.message?.includes("token")) {
      return errorResponse("Unauthorized", 401);
    }
    return errorResponse("Internal server error");
  }
};

export const GET = withAuth(getHandler);
