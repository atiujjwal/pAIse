import { api } from "@/src/lib/api";
import { ApiResponse } from "@/src/types/api";
import { useQuery } from "@tanstack/react-query";

// Matches the JSON you provided
interface DashboardSummary {
  total_balance: number;
  monthly_metrics: {
    total_spent: number;
    budget_limit: number;
    remaining: number;
    budget_used_percent: number;
  };
  spending_by_category: any[];
  upcoming_subscriptions: any[];
  // The summary endpoint returns a simplified list, but we use the /expenses endpoint for the detailed feed
  recent_expenses: any[];
}

export const useDashboardSummary = () => {
  const result =  useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: async () => {
    //   [cite_start]; // Integration: GET /api/dashboard/summary [cite: 196]
      const { data } = await api.get<ApiResponse<DashboardSummary>>(
        "api/dashboard/summary"
      );
      return data.data!;
    },
    staleTime: 1000 * 60 * 5,
  });
  console.log("32: ", result);
  
  return result;
};

export const useRecentExpenses = () => {
  return useQuery({
    queryKey: ["expenses", "recent"],
    queryFn: async () => {
    //   [cite_start]; // Integration: GET /api/expenses?limit=5 [cite: 319]
      // FIXED: Accessing data.data.data based on your JSON response
      const { data } = await api.get<ApiResponse<{ data: any[] }>>(
        "api/expenses",
        {
          params: { limit: 5, sort_by: "date", sort_order: "desc" },
        }
      );
      return data.data!.data;
    },
  });
};
