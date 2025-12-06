import { api } from "@/src/lib/api";
import { ApiResponse } from "@/src/types/api";
import { useQuery } from "@tanstack/react-query";


interface DashboardSummary {
  total_spent: string;
  currency: string;
  outstanding_balance: string; // Positive = you are owed, Negative = you owe
  monthly_spending: { date: string; amount: number }[]; // For charts
}

export const useDashboardSummary = () => {
  return useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: async () => {
      // Integration: GET /api/dashboard/summary
      const { data } = await api.get<ApiResponse<DashboardSummary>>(
        "api/dashboard/summary"
      );
      return data.data!;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
};

export const useRecentExpenses = () => {
  return useQuery({
    queryKey: ["expenses", "recent"],
    queryFn: async () => {
      // Integration: GET /api/expenses?limit=5
      const { data } = await api.get<ApiResponse<{ items: any[] }>>(
        "api/expenses",
        {
          params: { limit: 5, sort_by: "date", sort_order: "desc" },
        }
      );
      return data.data!.items;
    },
  });
};
