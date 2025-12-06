import { useToastStore } from "@/src/hooks/use-toast";
import { api } from "@/src/lib/api";
import { User } from "@/src/lib/types";
import { ApiResponse } from "@/src/types/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";


export interface GroupDetails {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  members: {
    id: string;
    role: "ADMIN" | "MEMBER"; // [cite: 25]
    user: User;
  }[];
}

export const useGroupDetails = (groupId: string) => {
  return useQuery({
    queryKey: ["groups", groupId],
    queryFn: async () => {
      // Integration: GET /api/groups/:groupId [cite: 141]
      const { data } = await api.get<ApiResponse<GroupDetails>>(
        `api/groups/${groupId}`
      );
      return data.data!;
    },
  });
};

export const useGroupBalances = (groupId: string) => {
  return useQuery({
    queryKey: ["balances", groupId],
    queryFn: async () => {
      // Integration: GET /api/balances/groups/:groupId [cite: 183]
      const { data } = await api.get<ApiResponse<{ balances: any[] }>>(
        `api/balances/groups/${groupId}`
      );
      return data.data!.balances;
    },
  });
};

export const useGroupActions = (groupId: string) => {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  const simplifyDebts = useMutation({
    mutationFn: async () => {
      // Integration: POST /api/groups/:groupId/simplify [cite: 187]
      const { data } = await api.post(`api/groups/${groupId}/simplify`);
      return data.data;
    },
    onSuccess: () => addToast("Debts simplified calculation ready", "success"),
  });

  return { simplifyDebts };
};
