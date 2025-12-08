import { useQuery } from "@tanstack/react-query";
import { api } from "@/src/lib/api";
import { ApiResponse } from "@/src/types/api";
import { Expense } from "@/src/lib/types";


interface GetExpensesParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  group_id?: string;
  friend_id?: string;
  from_date?: string;
  to_date?: string;
  min_amount?: string;
  max_amount?: string;
  sort_by?: string;
  sort_order?: string;
}

export const useExpenses = (params: GetExpensesParams) => {
  return useQuery({
    // Include all params in the queryKey so it refetches when they change
    queryKey: ["expenses", params],
    queryFn: async () => {
      // Clean undefined/empty params
      const queryParams = Object.fromEntries(
        Object.entries(params).filter(([_, v]) => v != null && v !== "")
      );

      const { data } = await api.get<
        ApiResponse<{ data: Expense[]; meta: any }>
      >("api/expenses", {
        params: queryParams,
      });
      return data.data;
    },
    placeholderData: (previousData) => previousData,
  });
};
