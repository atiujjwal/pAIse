import { useQuery } from "@tanstack/react-query";
import { api } from "@/src/lib/api";

// --- Types ---
export interface AnalyticsSummary {
  total_spent: number;
  currency: string;
  period: { from: string; to: string };
  spending_by_category: {
    category: string;
    amount: number;
    percentage: number;
  }[];
}

export interface AnalyticsTrend {
  date: string;
  amount: number;
  display_date: string;
}

export interface TrendsResponse {
  granularity: "day" | "month";
  trends: AnalyticsTrend[];
}

interface AnalyticsParams {
  from_date?: string;
  to_date?: string;
  group_id?: string;
  category?: string;
  granularity?: "day" | "month";
}

// --- Hooks ---

export const useAnalyticsSummary = (params: AnalyticsParams) => {
  return useQuery({
    queryKey: ["analytics", "summary", params],
    queryFn: async () => {
      const query = new URLSearchParams();
      if (params.from_date) query.append("from_date", params.from_date);
      if (params.to_date) query.append("to_date", params.to_date);
      if (params.group_id && params.group_id !== "all")
        query.append("group_id", params.group_id);

      const { data } = await api.get(`/analytics/summary?${query.toString()}`);
      return data.data as AnalyticsSummary;
    },
    // Keep data fresh but don't refetch aggressively
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useAnalyticsTrends = (params: AnalyticsParams) => {
  return useQuery({
    queryKey: ["analytics", "trends", params],
    queryFn: async () => {
      const query = new URLSearchParams();
      if (params.from_date) query.append("from_date", params.from_date);
      if (params.to_date) query.append("to_date", params.to_date);
      if (params.granularity) query.append("granularity", params.granularity);
      if (params.group_id && params.group_id !== "all")
        query.append("group_id", params.group_id);

      const { data } = await api.get(`/analytics/trends?${query.toString()}`);
      return data.data as TrendsResponse;
    },
    staleTime: 1000 * 60 * 5,
  });
};
