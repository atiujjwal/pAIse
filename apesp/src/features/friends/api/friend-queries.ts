import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/src/lib/api";
import { ApiResponse, User } from "@/src/types/api";
import { useToastStore } from "@/src/hooks/use-toast";

export interface FriendshipRequest {
  id: string;
  requester: User;
  status: "PENDING";
  created_at: string;
}

// Fetch Accepted Friends
export const useFriends = () => {
  return useQuery({
    queryKey: ["friends", "list"],
    queryFn: async () => {
      // Integration: GET /api/friends
      const { data } = await api.get<ApiResponse<{ friends: User[] }>>(
        "/friends"
      );
      return data.data!.friends;
    },
  });
};

// Fetch Pending Requests
export const useFriendRequests = () => {
  return useQuery({
    queryKey: ["friends", "requests"],
    queryFn: async () => {
      // Integration: GET /api/friends/requests
      const { data } = await api.get<
        ApiResponse<{ requests: FriendshipRequest[] }>
      >("/friends/requests");
      return data.data!.requests;
    },
  });
};

// Actions: Accept/Reject/Add
export const useFriendActions = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  // Send Request Mutation (Updated for Email/Code flow)
  const sendRequest = useMutation({
    mutationFn: async (data: { email?: string; invite_code?: string }) => {
      await api.post("/friends/requests", data);
    },
    onSuccess: () => {
      addToast("Friend request sent successfully", "success");
      // Invalidate outgoing requests if you have a query for that, otherwise just refresh relevant caches
      queryClient.invalidateQueries({ queryKey: ["friend-requests"] });
    },
    onError: (error: any) => {
      // Handle specific API error messages (404, 409, 400)
      const message =
        error?.response?.data?.message || "Failed to send request";
      addToast(message, "error");
    },
  });

  // Accept Request Mutation
  const acceptRequest = useMutation({
    mutationFn: async (requestId: string) => {
      await api.patch(`/friends/requests/${requestId}/accept`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      queryClient.invalidateQueries({ queryKey: ["friend-requests"] });
      addToast("Friend request accepted", "success");
    },
    onError: () => addToast("Failed to accept request", "error"),
  });

  // Reject Request Mutation
  const rejectRequest = useMutation({
    mutationFn: async (requestId: string) => {
      await api.patch(`/friends/requests/${requestId}/reject`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friend-requests"] });
      addToast("Friend request rejected", "info");
    },
    onError: () => addToast("Failed to reject request", "error"),
  });

  return {
    sendRequest,
    acceptRequest,
    rejectRequest,
  };
};
