import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/src/lib/api";
import { useToastStore } from "@/src/hooks/use-toast";

// --- Types ---
interface CreateSettlementPayload {
  receiver_id: string;
  group_id?: string | null;
  amount: string;
  date: string;
}

interface SettlementFilters {
  group_id?: string;
  friend_id?: string;
  type?: "paid" | "received";
}

// --- Hooks ---

/**
 * Fetches settlement history.
 * Supports filtering by group_id OR friend_id to reuse the same API endpoint.
 */
export const useSettlements = (filters?: SettlementFilters) => {
  return useQuery({
    // Include filters in the query key for automatic caching/refetching
    queryKey: ["settlements", filters],
    queryFn: async () => {
      // Pass filters as query params to the GET /settlements endpoint
      const { data } = await api.get("/settlements", { params: filters });
      return data.data?.settlements || [];
    },
  });
};

export const useCreateSettlement = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  return useMutation({
    mutationFn: async (payload: CreateSettlementPayload) => {
      const { data } = await api.post("/settlements", payload);
      return data.data;
    },
    onSuccess: (_, variables) => {
      addToast("Payment recorded successfully", "success");

      // 1. Invalidate General Data
      queryClient.invalidateQueries({ queryKey: ["balances"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["settlements"] }); // Refresh all history lists

      // 2. Invalidate Context-Specific Data
      if (variables.group_id) {
        // If settled inside a group, refresh that group's details and balances
        queryClient.invalidateQueries({
          queryKey: ["groups", variables.group_id],
        });
      } else {
        // If settled with a friend (non-group), refresh friend lists
        queryClient.invalidateQueries({ queryKey: ["friends"] });
      }
    },
    onError: (err: any) => {
      const message =
        err?.response?.data?.message || "Failed to record payment";
      addToast(message, "error");
    },
  });
};
