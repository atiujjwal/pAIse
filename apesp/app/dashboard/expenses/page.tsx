"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Plus, Receipt } from "lucide-react";

import { Button } from "@/src/components/ui/Button";
import { FilterBar } from "@/src/components/expenses/FilterBar";
import { useExpenses } from "@/src/features/expenses/api/expense-queries";
import { Skeleton } from "@/src/components/ui/Skeleton";
import { ExpenseList } from "@/src/features/expenses/components/ExpenseList";

export default function ExpensesPage() {
  const searchParams = useSearchParams();

  const queryParams = useMemo(
    () => ({
      page: Number(searchParams.get("page")) || 1,
      limit: 20, // Increased limit for better scrolling
      search: searchParams.get("search") || undefined,
      category: searchParams.get("category") || undefined,
      sort_by: searchParams.get("sort_by") || "created_at",
      sort_order: searchParams.get("sort_order") || "desc",
      min_amount: searchParams.get("min_amount") || undefined,
      max_amount: searchParams.get("max_amount") || undefined,
      from_date: searchParams.get("from_date")
        ? new Date(searchParams.get("from_date")!).toISOString()
        : undefined,
      to_date: searchParams.get("to_date")
        ? new Date(searchParams.get("to_date")!).toISOString()
        : undefined,
    }),
    [searchParams]
  );

  const { data, isLoading, isError } = useExpenses(queryParams);
  const expenses = data?.data || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Expenses
          </h1>
          <p className="text-slate-500 mt-1">
            Track and filter all your transactions.
          </p>
        </div>
        <Button asChild className="shadow-lg shadow-primary/20">
          <Link href="/dashboard/expenses/new">
            <Plus className="mr-2 h-4 w-4" /> Add Expense
          </Link>
        </Button>
      </div>

      {/* Filter Bar */}
      <FilterBar />

      {/* Content List */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm min-h-[400px]">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
                <Skeleton className="h-8 w-20" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-red-500 mb-2">Error loading expenses</div>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        ) : expenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Receipt className="h-8 w-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">
              No expenses found
            </h3>
            <p className="text-slate-500 max-w-xs mt-1">
              Try adjusting your filters or create a new expense to get started.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {expenses.map((expense: any) => (
              <Link
                key={expense.id}
                href={`/dashboard/expenses/${expense.id}`}
                className="block hover:bg-slate-50/80 transition-colors"
              >
                <ExpenseList expense={expense} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
