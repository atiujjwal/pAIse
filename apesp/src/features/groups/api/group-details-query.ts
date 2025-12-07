import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/src/lib/api";
import { ApiResponse, User } from "@/src/types/api";
import { useToastStore } from "@/src/hooks/use-toast";

// FIXED: Interface matches your specific API JSON
export interface GroupDetails {
  id: string;
  name: string;
  description?: string;
  avatar_url?: string | null;
  // API returns an object, not just an ID string
  owner: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  members: {
    // "id" is missing in your API response for the member relation
    role: "ADMIN" | "MEMBER";
    joined_at: string;
    user: User;
  }[];
}

export const useGroupDetails = (groupId: string | undefined) => {
  const result = useQuery({
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
  return result;
};

export const useGroupBalances = (groupId: string | undefined) => {
  return useQuery({
    queryKey: ["balances", groupId],
    queryFn: async () => {
      if (!groupId) throw new Error("Group ID is required");
      const { data } = await api.get<ApiResponse<{ balances: any[] }>>(
        `api/balances/groups/${groupId}`
      );
      return data.data!.balances;
    },
    enabled: !!groupId,
  });
};

export const useGroupActions = (groupId: string | undefined) => {
  const { addToast } = useToastStore();

  const simplifyDebts = useMutation({
    mutationFn: async () => {
      if (!groupId) return;
      await api.get(`api/groups/${groupId}/simplify`);
    },
    onSuccess: () => addToast("Debts simplified calculation ready", "success"),
  });

  return { simplifyDebts };
};
