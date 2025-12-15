import { useQuery, keepPreviousData } from "@tanstack/react-query"; // Import keepPreviousData
import { api } from "@/src/lib/api";

// --- Types ---
export interface DashboardSnapshot {
  total_balance: string;
  group_net_balance: string;
  friend_net_balance: string;
  upcoming_subscriptions: any[];
  recent_expenses: any[];
  you_owe: any[];
  you_are_owed: any[];
}

export interface DashboardTrends {
  spending_analysis: {
    total_money_spent: number;
    group_money_spent: number;
    friend_money_spent: number;
    period: string;
  };
  spending_by_category: {
    category: string;
    amount: number;
    percentage: number;
  }[];
  granularity: "day" | "week" | "month" | "year";
  trends: { date: string; amount: number; display_date: string }[];
}

// Static Data Hook (Balances, Recents)
export const useDashboardSnapshot = () => {
  return useQuery<DashboardSnapshot>({
    queryKey: ["dashboard", "snapshot"],
    queryFn: async () => {
      const { data } = await api.get("/dashboard/summary");
      return data.data;
    },
    staleTime: 1000 * 60 * 5, // 5 mins
  });
};

// Filtered Data Hook (Charts, Trends)
export const useDashboardTrends = (range: string) => {
  return useQuery<DashboardTrends>({
    queryKey: ["dashboard", "trends", range],
    queryFn: async () => {
      const { data } = await api.get(`/dashboard/trends?range=${range}`);
      return data.data;
    },
    // Use the new v5 syntax for keeping previous data
    placeholderData: keepPreviousData,
  });
};
