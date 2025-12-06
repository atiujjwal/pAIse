import { useToastStore } from "@/src/hooks/use-toast";
import { api } from "@/src/lib/api";
import { User } from "@/src/lib/types";
import { ApiResponse } from "@/src/types/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";


interface FriendshipRequest {
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
      // Integration: GET /api/friends [cite: 127]
      const { data } = await api.get<ApiResponse<{ friends: User[] }>>(
        "api/friends"
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
      // Integration: GET /api/friends/requests [cite: 122]
      const { data } = await api.get<
        ApiResponse<{ requests: FriendshipRequest[] }>
      >("api/friends/requests");
      return data.data!.requests;
    },
  });
};

// Actions: Accept/Reject/Add
export const useFriendActions = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  const handleSuccess = (msg: string) => {
    queryClient.invalidateQueries({ queryKey: ["friends"] });
    addToast(msg, "success");
  };

  const sendRequest = useMutation({
    mutationFn: async (email: string) => {
      // Search first to get ID (Simplified flow)
      const searchRes = await api.get("api/users/search", {
        params: { q: email },
      });
      const user = searchRes.data.data.users[0];
      if (!user) throw new Error("User not found");

      // Integration: POST /api/friends/requests [cite: 121]
      await api.post("api/friends/requests", { addressee_id: user.id });
    },
    onSuccess: () => handleSuccess("Friend request sent!"),
    onError: (err: any) =>
      addToast(err.message || "Failed to send request", "error"),
  });

  const acceptRequest = useMutation({
    mutationFn: async (requestId: string) => {
      // Integration: POST /api/friends/requests/:id/accept [cite: 123]
      await api.post(`api/friends/requests/${requestId}/accept`);
    },
    onSuccess: () => handleSuccess("Friend request accepted!"),
  });

  const rejectRequest = useMutation({
    mutationFn: async (requestId: string) => {
      // Integration: DELETE /api/friends/requests/:id/reject [cite: 124]
      await api.delete(`api/friends/requests/${requestId}/reject`);
    },
    onSuccess: () => handleSuccess("Friend request ignored"),
  });

  return { sendRequest, acceptRequest, rejectRequest };
};
