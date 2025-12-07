import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/src/lib/api";
import { ApiResponse, User } from "@/src/types/api";
import { useToastStore } from "@/src/hooks/use-toast";

export interface GroupDetails {
  id: string;
  name: string;
  description?: string;
  avatar_url?: string | null;
  owner: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  members: {
    role: "ADMIN" | "MEMBER";
    joined_at: string;
    user: User;
  }[];
}

interface BalanceUser {
  id: string;
  name: string;
  avatar_url?: string;
  amount: string;
}

export interface GroupBalances {
  net_balance: string;
  currency: string;
  you_are_owed: BalanceUser[];
  you_owe: BalanceUser[];
}

export interface OptimizedPayment {
  from: { id: string; name: string; avatar_url?: string };
  to: { id: string; name: string; avatar_url?: string };
  amount: string;
}

export const useGroupDetails = (groupId: string | undefined) => {
  return useQuery({
    queryKey: ["groups", groupId],
    queryFn: async () => {
      if (!groupId) throw new Error("Group ID is required");
      const { data } = await api.get<ApiResponse<GroupDetails>>(
        `api/groups/${groupId}`
      );
      return data.data!;
    },
    enabled: !!groupId,
  });
};

export const useGroupBalances = (groupId: string | undefined) => {
  return useQuery({
    queryKey: ["balances", groupId],
    queryFn: async () => {
      if (!groupId) throw new Error("Group ID is required");
      const { data } = await api.get<ApiResponse<GroupBalances>>(
        `api/balances/groups/${groupId}`
      );
      return data.data!;
    },
    enabled: !!groupId,
  });
};

// --- Mutations ---

export const useSimplifyDebts = (groupId: string | undefined) => {
  return useMutation({
    mutationFn: async () => {
      if (!groupId) throw new Error("Group ID is required");
      // Matches your API: POST /api/groups/{groupId}/simplify
      const { data } = await api.get<
        ApiResponse<{ optimized_payments: OptimizedPayment[] }>
      >(`api/groups/${groupId}/simplify`);
      return data.data!.optimized_payments;
    },
  });
};
