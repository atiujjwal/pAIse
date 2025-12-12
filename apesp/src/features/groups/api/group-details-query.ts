import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/src/lib/api";
import { ApiResponse, User } from "@/src/types/api";
import { useToastStore } from "@/src/hooks/use-toast";
import { useRouter } from "next/navigation";

// --- Types ---

export interface GroupDetails {
  id: string;
  name: string;
  description?: string;
  avatar?: string | null;
  owner: {
    id: string;
    name: string;
    avatar?: string;
  };
  members: {
    role: "ADMIN" | "MEMBER";
    joined_at: string;
    user: User;
  }[];
}

export interface GroupBalances {
  net_balance: string;
  currency: string;
  you_are_owed: {
    id: string;
    name: string;
    avatar?: string;
    amount: string;
  }[];
  you_owe: { id: string; name: string; avatar?: string; amount: string }[];
}

export interface OptimizedPayment {
  from: { id: string; name: string; avatar?: string };
  to: { id: string; name: string; avatar?: string };
  amount: string;
}

export interface GroupExpense {
  id: string;
  description: string;
  amount: string;
  date: string;
  category: string;
  payers: {
    id: string;
    amount: string;
    user: {
      id: string;
      name: string;
      email: string;
      avatar: string | null;
    };
  }[];
  splits: {
    id: string;
    amount_owed: string;
    user: {
      id: string;
      name: string;
      email: string;
      avatar: string | null;
    };
  }[];
  group: {
    id: string;
    name: string;
    avatar: string | null;
  };
}

// --- Queries ---

export const useGroupDetails = (groupId: string | undefined) => {
  return useQuery({
    queryKey: ["groups", groupId],
    queryFn: async () => {
      if (!groupId) throw new Error("Group ID is required");
      const { data } = await api.get<ApiResponse<GroupDetails>>(
        `/groups/${groupId}`
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
        `/balances/groups/${groupId}`
      );
      return data.data!;
    },
    enabled: !!groupId,
  });
};

export const useGroupExpenses = (groupId: string | undefined) => {
  return useQuery({
    queryKey: ["group-expenses", groupId],
    queryFn: async () => {
      if (!groupId) throw new Error("Group ID is required");
      const { data } = await api.get<ApiResponse<{ expenses: GroupExpense[] }>>(
        `/groups/${groupId}/expenses`
      );
      return data.data!.expenses;
    },
    enabled: !!groupId,
  });
};

// --- Mutations ---

export const useCreateGroup = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      avatar?: string;
    }) => {
      const response = await api.post<ApiResponse<GroupDetails>>(
        "/groups",
        data
      );
      return response.data.data!;
    },
    onSuccess: (newGroup) => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      addToast("Group created successfully", "success");
      router.push(`/dashboard/groups/${newGroup.id}`);
    },
    onError: (err: any) =>
      addToast(err?.message || "Failed to create group", "error"),
  });
};

export const useUpdateGroup = (groupId: string) => {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  return useMutation({
    mutationFn: async (data: { name?: string; description?: string }) => {
      await api.patch(`/groups/${groupId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups", groupId] });
      addToast("Group updated successfully", "success");
    },
  });
};

export const useDeleteGroup = (groupId: string) => {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();
  const router = useRouter();

  return useMutation({
    mutationFn: async () => {
      await api.delete(`/groups/${groupId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      addToast("Group deleted", "success");
      router.push("/dashboard/groups");
    },
  });
};

export const useAddGroupMember = (groupId: string) => {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  return useMutation({
    mutationFn: async (userId: string) => {
      await api.post(`/groups/${groupId}/members`, {
        user_id: userId,
        role: "MEMBER",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups", groupId] });
      addToast("Member added successfully", "success");
    },
    onError: (err: any) =>
      addToast(err?.message || "Failed to add member", "error"),
  });
};

export const useSimplifyDebts = (groupId: string | undefined) => {
  return useMutation({
    mutationFn: async () => {
      if (!groupId) throw new Error("Group ID is required");
      const { data } = await api.get<
        ApiResponse<{ optimized_payments: OptimizedPayment[] }>
      >(`/groups/${groupId}/simplify`);
      return data.data!.optimized_payments;
    },
  });
};

// --- MEMBER MANAGEMENT MUTATIONS ---

export const useRemoveMember = (groupId: string) => {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  return useMutation({
    mutationFn: async (userId: string) => {
      // Integration: DELETE /api/groups/:groupId/members/:userId
      await api.delete(`/groups/${groupId}/members/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups", groupId] });
      addToast("Member removed successfully", "success");
    },
    onError: (err: any) =>
      addToast(err?.message || "Failed to remove member", "error"),
  });
};

export const useUpdateMemberRole = (groupId: string) => {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  return useMutation({
    mutationFn: async ({
      userId,
      role,
    }: {
      userId: string;
      role: "ADMIN" | "MEMBER";
    }) => {
      // Integration: PATCH /api/groups/:groupId/members/:userId
      await api.patch(`/groups/${groupId}/members/${userId}`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups", groupId] });
      addToast("Role updated successfully", "success");
    },
    onError: (err: any) =>
      addToast(err?.message || "Failed to update role", "error"),
  });
};

export const useUpdateGroupDetails = (groupId: string) => {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  return useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      // Integration: PUT /api/groups/:groupId
      const { data: res } = await api.put(`/groups/${groupId}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups", groupId] });
      addToast("Group details updated", "success");
    },
    onError: (err: any) =>
      addToast(err?.message || "Failed to update group", "error"),
  });
};
