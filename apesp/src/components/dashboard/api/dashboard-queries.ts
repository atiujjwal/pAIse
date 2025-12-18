import { useQuery } from "@tanstack/react-query";
import { api } from "@/src/lib/api";
import { ApiResponse } from "@/src/types/api";

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
  recent_expenses: any[];
}

export const useDashboardSummary = () => {
  const result = useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: async () => {
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
      // Matches the nested { data: { data: [...] } } structure
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
