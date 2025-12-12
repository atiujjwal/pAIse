"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Plus,
  Receipt,
  Layers,
  User,
  Calendar,
  Search,
  SlidersHorizontal,
} from "lucide-react";

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

// --- Local Component: Expense Card ---
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
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* --- HEADER SECTION --- */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Expenses
          </h1>
          <p className="text-slate-500 mt-2 text-sm leading-relaxed max-w-md">
            Manage your shared expenses, track balances, and settle up with
            friends and groups.
          </p>
        </div>
        <Button
          asChild
          size="lg"
          className="shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all"
        >
          <Link href="/dashboard/expenses/new">
            <Plus className="mr-2 h-5 w-5" /> Add Expense
          </Link>
        </Button>
      </div>

      {/* --- BEAUTIFIED FILTER & SEARCH SECTION --- */}
      {/* Wrapped in a sticky, polished container for a 'Control Panel' feel */}
      <div className="sticky top-4 z-20">
        <div className="bg-white/80 backdrop-blur-xl p-4 rounded-2xl border border-slate-200/60 shadow-sm ring-1 ring-slate-200/50 transition-all hover:shadow-md hover:border-slate-300/60">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            {/* Visual Label (Optional, adds structure) */}
            <div className="hidden md:flex items-center gap-2 text-slate-400 text-sm font-medium pr-4 border-r border-slate-200 h-10">
              <SlidersHorizontal className="h-4 w-4" />
              <span>Filters</span>
            </div>

            {/* The Actual Filter Bar Component */}
            <div className="flex-1 w-full">
              <FilterBar />
            </div>
          </div>
        </div>
      </div>

      {/* --- CONTENT LIST --- */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden min-h-[400px]">
        {isLoading ? (
          <div className="p-6 space-y-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
                <Skeleton className="h-8 w-24 rounded-lg" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="p-3 bg-red-50 rounded-full mb-3">
              <Receipt className="h-6 w-6 text-red-400" />
            </div>
            <h3 className="text-slate-900 font-semibold mb-1">
              Unable to load expenses
            </h3>
            <p className="text-slate-500 text-sm mb-4">
              Something went wrong while fetching data.
            </p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        ) : expenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center px-4">
            <div className="h-20 w-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-slate-100 transform rotate-3">
              <Receipt className="h-10 w-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              No expenses found
            </h3>
            <p className="text-slate-500 max-w-sm mt-2 mb-6">
              We couldn't find any expenses matching your filters. Try adjusting
              them or create a new one.
            </p>
            <Button
              variant="secondary"
              onClick={() => window.location.reload()}
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {expenses.map((expense: any) => (
              <Link
                key={expense.id}
                href={`/dashboard/expenses/${expense.id}`}
                className="block hover:bg-slate-50/80 transition-colors"
              >
                <ExpenseCard expense={expense} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
