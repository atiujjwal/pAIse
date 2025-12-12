import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/src/lib/api";
import { ApiResponse, User } from "@/src/types/api";
import { useToastStore } from "@/src/hooks/use-toast";
import { useRouter } from "next/navigation";

// --- Types ---
export interface ExpenseDetails {
  id: string;
  description: string;
  amount: string;
  currency: string;
  date: string;
  category: string;
  receipt_url?: string | null;
  status: "ACTIVE" | "DELETED";
  split_type: string;
  created_by: User;
  group?: { id: string; name: string; avatar?: string } | null;
  payers: {
    id: string;
    amount: string;
    user: User;
  }[];
  splits: {
    id: string;
    amount_owed: string;
    percent_owed?: string;
    shares_owed?: string;
    user: User;
  }[];
}

// --- Queries ---

export const useExpenses = (params: any) => {
  return useQuery({
    queryKey: ["expenses", params],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<{ data: any[]; meta: any }>>(
        "/expenses",
        { params }
      );
      return data.data!;
    },
  });
};

export const useExpenseDetails = (expenseId: string) => {
  return useQuery({
    queryKey: ["expenses", expenseId],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<ExpenseDetails>>(
        `/expenses/${expenseId}`
      );
      return data.data!;
    },
    enabled: !!expenseId,
  });
};

// --- Mutations ---

export const useDeleteExpense = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();
  const router = useRouter();

  return useMutation({
    mutationFn: async (expenseId: string) => {
      await api.delete(`/expenses/${expenseId}`);
    },
    onSuccess: () => {
      addToast("Expense deleted successfully", "success");
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["balances"] });
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      router.back();
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || "Failed to delete expense";
      addToast(message, "error");
    },
  });
};
