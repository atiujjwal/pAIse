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

  const handleSuccess = (msg: string) => {
    // Invalidate both lists so UI updates immediately
    queryClient.invalidateQueries({ queryKey: ["friends"] });
    addToast(msg, "success");
  };

  const sendRequest = useMutation({
    mutationFn: async (userId: string) => {
      // Integration: POST /api/friends/requests
      // Payload: { addressee_id: "userId" }
      await api.post("/friends/requests", { addressee_id: userId });
    },
    onSuccess: () => handleSuccess("Friend request sent!"),
    onError: (err: any) =>
      addToast(err.message || "Failed to send request", "error"),
  });

  const acceptRequest = useMutation({
    mutationFn: async (requestId: string) => {
      // Integration: POST /api/friends/requests/:id/accept
      await api.post(`/friends/requests/${requestId}/accept`);
    },
    onSuccess: () => handleSuccess("Friend request accepted!"),
  });

  const rejectRequest = useMutation({
    mutationFn: async (requestId: string) => {
      // Integration: DELETE /api/friends/requests/:id/reject
      await api.delete(`/friends/requests/${requestId}/reject`);
    },
    onSuccess: () => handleSuccess("Friend request ignored"),
  });

  return { sendRequest, acceptRequest, rejectRequest };
};
