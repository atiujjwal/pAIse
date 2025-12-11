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

// --- Queries ---

export const useFriends = () => {
  return useQuery({
    queryKey: ["friends", "list"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<{ friends: User[] }>>(
        "/friends"
      );
      return data.data!.friends;
    },
  });
};

export const useFriendRequests = () => {
  return useQuery({
    queryKey: ["friends", "requests"],
    queryFn: async () => {
      const { data } = await api.get<
        ApiResponse<{ requests: FriendshipRequest[] }>
      >("/friends/requests");
      return data.data!.requests;
    },
  });
};

// --- Mutations ---

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
      // If you have a "Sent Requests" list, invalidate it here
      queryClient.invalidateQueries({ queryKey: ["friends", "sent-requests"] });
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

  // Reject Request (For Recipient)
  // Uses your existing DELETE endpoint
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

  // Cancel/Revoke Request (For Sender)
  // Uses THE SAME DELETE endpoint, but we wrap it for semantic clarity in UI
  const cancelRequest = useMutation({
    mutationFn: async (requestId: string) => {
      await api.delete(`/friends/requests/${requestId}/reject`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends", "sent-requests"] });
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
