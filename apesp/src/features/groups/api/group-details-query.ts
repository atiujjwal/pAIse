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

export interface GroupBalances {
  net_balance: string;
  currency: string;
  you_are_owed: {
    id: string;
    name: string;
    avatar_url?: string;
    amount: string;
  }[];
  you_owe: { id: string; name: string; avatar_url?: string; amount: string }[];
}

export interface OptimizedPayment {
  from: { id: string; name: string; avatar_url?: string };
  to: { id: string; name: string; avatar_url?: string };
  amount: string;
}

// --- Queries ---

export const useGroupDetails = (groupId: string | undefined) => {
  const result =  useQuery({
    queryKey: ["groups", groupId],
    queryFn: async () => {
      if (!groupId) throw new Error("Group ID is required");
      const { data } = await api.get<ApiResponse<GroupDetails>>(
        `api/groups/${groupId}`
      );
      console.log("54: ", data);
      
      return data.data!;
    },
    enabled: !!groupId,
  });
  console.log("58: ", result);
  
  return result;
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

export const useCreateGroup = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();
  const router = useRouter(); // This now uses the correct App Router hook

  return useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      avatar_url?: string;
    }) => {
      const response = await api.post<ApiResponse<GroupDetails>>(
        "api/groups",
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
      await api.patch(`api/groups/${groupId}`, data);
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
  const router = useRouter(); // This now uses the correct App Router hook

  return useMutation({
    mutationFn: async () => {
      await api.delete(`api/groups/${groupId}`);
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
      await api.post(`api/groups/${groupId}/members`, {
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
      >(`api/groups/${groupId}/simplify`);
      return data.data!.optimized_payments;
    },
  });
};

