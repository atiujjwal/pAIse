import { api } from "@/src/lib/api";
import { ApiResponse } from "@/src/types/api";
import { useQuery } from "@tanstack/react-query";

// Matches the JSON you provided
export interface DashboardSummary {
  total_balance: string | number; // Backend sends string (toFixed(2))
  monthly_metrics: {
    total_spent: number;
    budget_limit: number;
    remaining: number;
    budget_used_percent: number;
  };
  upcoming_subscriptions: any[];
  recent_expenses: any[];
  // Added these because your Backend sends them!
  you_owe: any[];
  you_are_owed: any[];
}

export const useDashboardSummary = () => {
  const result = useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: async () => {
      //   [cite_start]; // Integration: GET /api/dashboard/summary [cite: 196]
      const { data } = await api.get<ApiResponse<DashboardSummary>>(
        "/dashboard/summary"
      );
      return data.data!;
    },
    staleTime: 1000 * 60 * 5,
  });
  return result;
};

export const useRecentExpenses = () => {
  return useQuery({
    queryKey: ["expenses", "recent"],
    queryFn: async () => {
      //   [cite_start]; // Integration: GET /api/expenses?limit=5 [cite: 319]
      // FIXED: Accessing data.data.data based on your JSON response
      const { data } = await api.get<ApiResponse<{ data: any[] }>>(
        "/expenses",
        {
          params: { limit: 5, sort_by: "date", sort_order: "desc" },
        }
      );
      return data.data!.data;
    },
  });
};
