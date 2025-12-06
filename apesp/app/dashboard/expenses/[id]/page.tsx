"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Trash2, Edit2, Calendar, Receipt } from "lucide-react";
import { useToastStore } from "@/src/hooks/use-toast";
import { api } from "@/src/lib/api";
import { ApiResponse } from "@/src/types/api";
import { Skeleton } from "@/src/components/ui/Skeleton";
import { Button } from "@/src/components/ui/Button";
import { formatCurrency } from "@/src/lib/utils";

// Helper to calculate percentages for visual bars
const calculatePercent = (part: string, total: string) => {
  return Math.min(
    100,
    Math.round((parseFloat(part) / parseFloat(total)) * 100)
  );
};

export default function ExpenseDetailsPage() {
  const { expenseId } = useParams();
  const router = useRouter();
  const { addToast } = useToastStore();
  const queryClient = useQueryClient();

  const { data: expense, isLoading } = useQuery({
    queryKey: ["expenses", expenseId],
    queryFn: async () => {
      // Integration: GET /expenses/{expenseId}
      const { data } = await api.get<ApiResponse<any>>(
        `api/expenses/${expenseId}`
      );
      return data.data!;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      // Integration: DELETE /expenses/{expenseId} [cite: 157]
      await api.delete(`api/expenses/${expenseId}`);
    },
    onSuccess: () => {
      addToast("Expense deleted", "success");
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["balances"] }); // Recalculate balances
      router.push("/expenses");
    },
    onError: () => addToast("Failed to delete expense", "error"),
  });

  if (isLoading)
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  if (!expense)
    return <div className="text-center py-10">Expense not found</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <div className="flex gap-2">
          {/* Edit flow would reuse Wizard with initial data */}
          <Button variant="outline" size="icon" disabled>
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            variant="destructive"
            size="icon"
            onClick={() => {
              if (confirm("Are you sure? This will affect balances."))
                deleteMutation.mutate();
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Card */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {/* Banner */}
        <div className="bg-muted/30 p-8 text-center border-b">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Receipt className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold">{expense.description}</h1>
          <div className="mt-2 text-3xl font-bold text-primary">
            {formatCurrency(expense.amount, expense.currency)}
          </div>
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            {new Date(expense.date).toLocaleDateString()} at{" "}
            {new Date(expense.date).toLocaleTimeString()}
          </div>
          <div className="mt-1 text-sm text-muted-foreground capitalize">
            Category: {expense.category}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x">
          {/* Who Paid Section */}
          <div className="p-6 space-y-4">
            <h3 className="font-semibold text-sm uppercase text-muted-foreground">
              Who Paid
            </h3>
            <div className="space-y-3">
              {expense.payers.map((payer: any) => (
                <div
                  key={payer.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-xs font-bold text-green-700">
                      {payer.user?.name[0]}
                    </div>
                    <span className="font-medium">{payer.user?.name}</span>
                  </div>
                  <span className="font-bold text-green-600">
                    {formatCurrency(payer.amount, expense.currency)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Who Owes Section */}
          <div className="p-6 space-y-4">
            <h3 className="font-semibold text-sm uppercase text-muted-foreground">
              Who Owes
            </h3>
            <div className="space-y-4">
              {expense.splits.map((split: any) => (
                <div key={split.id} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span>{split.user?.name}</span>
                    </div>
                    <span className="font-medium">
                      {formatCurrency(split.amount_owed, expense.currency)}
                    </span>
                  </div>
                  {/* Visual Split Bar */}
                  <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full bg-red-400"
                      style={{
                        width: `${calculatePercent(
                          split.amount_owed,
                          expense.amount
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {expense.receipt_url && (
        <div className="rounded-xl border bg-card p-6">
          <h3 className="font-semibold mb-4">Receipt</h3>
          <img
            src={expense.receipt_url}
            alt="Receipt"
            className="rounded-lg max-h-96 object-contain mx-auto"
          />
        </div>
      )}
    </div>
  );
}
