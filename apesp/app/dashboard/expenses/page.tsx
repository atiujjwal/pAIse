"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Plus, Receipt, Layers, User, Calendar } from "lucide-react";

import { Button } from "@/src/components/ui/Button";
import { FilterBar } from "@/src/components/expenses/FilterBar";
import { useExpenses } from "@/src/features/expenses/api/expense-queries";
import { Skeleton } from "@/src/components/ui/Skeleton";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/src/components/ui/Avatar";
import { formatCurrency, cn } from "@/src/lib/utils";
import { useAuthStore } from "@/src/features/auth/store";

const ExpenseCard = ({ expense }: { expense: any }) => {
  const { user } = useAuthStore();

  const isGroupExpense = !!expense.group;

  let avatarUrl: string | null | undefined = null;
  let displayName: string = "";
  let FallbackIcon = User;

  if (isGroupExpense) {
    avatarUrl = expense.group.avatar;
    displayName = expense.group.name;
    FallbackIcon = Layers;
  } else {
    const otherPerson = expense.splits.find(
      (split: any) => split.user.id !== user?.id
    )?.user;

    if (otherPerson) {
      avatarUrl = otherPerson.avatar;
      displayName = otherPerson.name;
    } else {
      avatarUrl = expense.created_by.avatar;
      displayName = expense.created_by.name;
    }
    FallbackIcon = User;
  }

  return (
    <div className="flex items-center gap-4 p-4">
      {/* Dynamic Avatar Section */}
      <Avatar className="h-10 w-10 border border-slate-100 shadow-sm">
        <AvatarImage src={avatarUrl || undefined} className="object-cover" />
        <AvatarFallback
          className={cn(
            "text-xs font-bold",
            isGroupExpense
              ? "bg-indigo-50 text-indigo-600"
              : "bg-emerald-50 text-emerald-600"
          )}
        >
          {displayName?.[0]?.toUpperCase() || (
            <FallbackIcon className="h-4 w-4" />
          )}
        </AvatarFallback>
      </Avatar>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h4 className="font-semibold text-sm text-slate-900 truncate">
            {expense.description}
          </h4>
          {/* Small context badge */}
          <span className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-600">
            {isGroupExpense ? "Group" : "Friend"}
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>
              {new Date(expense.date).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
          <span className="text-slate-300">•</span>
          <span className="capitalize">{expense.category}</span>
          <span className="text-slate-300">•</span>
          <span className="truncate max-w-[100px]">
            {isGroupExpense ? expense.group.name : displayName}
          </span>
        </div>
      </div>

      {/* Amount Section */}
      <div className="text-right">
        <span className="block font-bold text-slate-900 font-mono text-sm">
          {formatCurrency(expense.amount, expense.currency)}
        </span>
        <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">
          {expense.split_type}
        </span>
      </div>
    </div>
  );
};

// --- Main Page Component ---

export default function ExpensesPage() {
  const searchParams = useSearchParams();

  const queryParams = useMemo(
    () => ({
      page: Number(searchParams.get("page")) || 1,
      limit: 20,
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
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm min-h-[400px] overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
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
                {/* Using the new Local ExpenseCard Logic */}
                <ExpenseCard expense={expense} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
