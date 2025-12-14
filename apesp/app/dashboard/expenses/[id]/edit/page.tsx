"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useExpenseDetails } from "@/src/features/expenses/api/expense-queries";
import ExpenseForm from "@/src/components/forms/expense/ExpenseForm";
import { Button } from "@/src/components/ui/Button";
import { useAuthStore } from "@/src/features/auth/store";
import { User } from "@/src/types/api";

export default function EditExpensePage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: expense, isLoading, isError } = useExpenseDetails(id as string);
  const { user: currentUser } = useAuthStore();

  let isGroupExpense = expense?.group_id;

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !expense) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <h2 className="text-xl font-bold text-foreground">
          Failed to load expense
        </h2>
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="rounded-xl"
        >
          Go Back
        </Button>
      </div>
    );
  }
  
  console.log("43: ", expense);
  
  // Format Data for the Form
  const initialData = {
    amount: expense.amount.toString(),
    description: expense.description,
    category: expense.category,
    date: new Date(expense.date).toISOString().slice(0, 10),
    currency: expense.currency,
    group_id: expense.group_id,
    friend_id: expense.friend_id,
    split_type: expense.split_type as any,
    payers: expense.payers.map((p) => ({
      user_id: p.user.id,
      amount: p.amount.toString(),
    })),
    splits: expense.splits.map((s) => ({
      user_id: s.user.id,
      amount_owed: s.amount_owed,
      shares_owed: s.shares_owed,
      percent_owed: s.percent_owed,
    })),
  };

  if (!isGroupExpense) {
    initialData.friend_id = expense.friend?.id;
  }

  return (
    <div className="max-w-2xl mx-auto pb-20 pt-6">
      {/* Navigation */}
      <div className="mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="text-muted-foreground hover:text-foreground hover:bg-muted -ml-3 rounded-xl"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> back
        </Button>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          Edit Expense
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Update details for{" "}
          <span className="font-semibold text-foreground">
            &quot;{expense.description}&quot;
          </span>
        </p>
      </div>

      <ExpenseForm
        mode="edit"
        expenseId={id as string}
        initialData={initialData}
      />
    </div>
  );
}
