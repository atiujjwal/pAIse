import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/src/lib/api";
import { ApiResponse, User } from "@/src/types/api";
import { useToastStore } from "@/src/hooks/use-toast";

export interface FriendshipRequest {
  id: string;
  requester: User;
  addressee: User;
  status: "PENDING";
  created_at: string;
}

interface RemindPayload {
  friendId: string;
  amount: string;
  message?: string;
}

export interface FriendDetails {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  net_balance: string;
  status: "settled" | "owe" | "owed";
  currency: string;
  expenses: {
    friend_expenses: ExpenseItem[];
    group_expenses: GroupExpenseItem[];
  };
}

export interface ExpenseItem {
  id: string;
  description: string;
  amount: string;
  category: string;
  date: string;
  status: string;
  created_by: { id: string; name: string; avatar: string | null };
}

export interface GroupExpenseItem extends ExpenseItem {
  group_id: string;
  group: { id: string; name: string; avatar: string | null };
}

interface FriendQueryParams {
  search?: string;
  sort_by?: "balance" | "status" | "name";
  sort_order?: "asc" | "desc";
}

// --- QUERIES ---

// Fetch Accepted Friends
export const useFriends = (params?: FriendQueryParams) => {
  return useQuery({
    queryKey: ["friends", params],
    queryFn: async () => {
      const query = new URLSearchParams();
      if (params?.search) query.append("search", params.search);
      if (params?.sort_by) query.append("sort_by", params.sort_by);
      if (params?.sort_order) query.append("sort_order", params.sort_order);

      const { data } = await api.get(`/friends?${query.toString()}`);
      return data.data.friends;
    },
  });
};

export const useFriendDetails = (friendId: string) => {
  return useQuery({
    queryKey: ["friend", friendId],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<FriendDetails>>(
        `/friends/${friendId}`
      );
      return data.data!;
    },
    enabled: !!friendId,
  });
};

// Fetch Pending Requests (Supports Incoming/Outgoing)
// Defaults to "incoming" to preserve existing behavior for other components
export const useFriendRequests = (
  type: "incoming" | "outgoing" = "incoming"
) => {
  return useQuery({
    queryKey: ["friends", "requests", type],
    queryFn: async () => {
      const { data } = await api.get<
        ApiResponse<{ requests: FriendshipRequest[] }>
      >(`/friends/requests?type=${type}`);
      return data.data!.requests;
    },
  });
};

export const useFriendActions = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  const handleError = (error: any, defaultMessage: string) => {
    const message =
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      defaultMessage;
    addToast(message, "error");
  };

  // Send Request
  const sendRequest = useMutation({
    mutationFn: async (data: { email: string }) => {
      await api.post("/friends/requests", data);
    },
    onSuccess: () => {
      addToast("Friend request sent successfully", "success");
      // Invalidate outgoing list so the new request appears immediately
      queryClient.invalidateQueries({
        queryKey: ["friends", "requests", "outgoing"],
      });
    },
    onError: (error) => handleError(error, "Failed to send request"),
  });

  // Accept Request
  const acceptRequest = useMutation({
    mutationFn: async (requestId: string) => {
      await api.patch(`/friends/requests/${requestId}/accept`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends", "list"] });
      queryClient.invalidateQueries({ queryKey: ["friends", "requests"] });
      addToast("Friend request accepted", "success");
    },
    onError: (error) => handleError(error, "Failed to accept request"),
  });

  // Reject Request (Incoming)
  const rejectRequest = useMutation({
    mutationFn: async (requestId: string) => {
      await api.delete(`/friends/requests/${requestId}/reject`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends", "requests"] });
      addToast("Friend request rejected", "info");
    },
    onError: (error) => handleError(error, "Failed to reject request"),
  });

  // Cancel Request (Outgoing)
  const cancelRequest = useMutation({
    mutationFn: async (requestId: string) => {
      await api.delete(`/friends/requests/${requestId}/reject`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["friends", "requests", "outgoing"],
      });
      addToast("Friend request cancelled", "success");
    },
    onError: (error) => handleError(error, "Failed to cancel request"),
  });

  return {
    sendRequest,
    acceptRequest,
    rejectRequest,
    cancelRequest,
  };
};

export const useRemindFriend = () => {
  const { addToast } = useToastStore();

  return useMutation({
    mutationFn: async ({ friendId, amount, message }: RemindPayload) => {
      await api.post(`/friends/${friendId}/remind`, { amount, message });
    },
    onSuccess: () => {
      addToast("Reminder sent successfully", "success");
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to send reminder";
      addToast(message, "error");
    },
  });
};
