"use client";

import { useMemo, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  Plus,
  Receipt,
  Layers,
  User,
  Calendar,
  SlidersHorizontal,
  ArrowRight,
  Users,
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
    <div className="group flex items-center justify-between p-5 hover:bg-muted/40 transition-all duration-200">
      <div className="flex items-center gap-5 overflow-hidden">
        {/* Dynamic Avatar Section */}
        <Avatar className="h-12 w-12 border border-border shadow-sm group-hover:border-primary/30 transition-colors">
          <AvatarImage src={avatarUrl || undefined} className="object-cover" />
          <AvatarFallback
            className={cn(
              "text-xs font-bold",
              isGroupExpense
                ? "bg-primary/10 text-primary"
                : "bg-secondary/10 text-secondary"
            )}
          >
            {displayName?.[0]?.toUpperCase() || (
              <FallbackIcon className="h-5 w-5" />
            )}
          </AvatarFallback>
        </Avatar>

        {/* Main Content */}
        <div className="flex flex-col min-w-0 gap-1">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-base text-foreground truncate group-hover:text-primary transition-colors">
              {expense.description}
            </h4>
            <span
              className={cn(
                "hidden sm:inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border",
                isGroupExpense
                  ? "bg-primary/5 text-primary border-primary/10"
                  : "bg-secondary/5 text-secondary border-secondary/10"
              )}
            >
              {isGroupExpense ? "Group" : "Friend"}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>
                {new Date(expense.date).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
            <span className="text-border">•</span>
            <span className="capitalize font-medium">{expense.category}</span>
            <span className="text-border">•</span>
            <span className="truncate max-w-[100px]">
              {isGroupExpense ? expense.group.name : displayName}
            </span>
          </div>
        </div>
      </div>

      {/* Amount Section */}
      <div className="text-right pl-2">
        <span className="block font-mono font-bold text-foreground text-lg group-hover:scale-105 transition-transform origin-right">
          {formatCurrency(expense.amount, expense.currency)}
        </span>
        <div className="flex justify-end items-center gap-1 mt-1">
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider bg-muted/50 px-2 py-0.5 rounded-md">
            {expense.split_type}
          </span>
          <ArrowRight className="h-3 w-3 text-muted-foreground/0 group-hover:text-primary transition-all -translate-x-2 group-hover:translate-x-0" />
        </div>
      </div>
    </div>
  );
};

// --- Main Page Component ---

export default function ExpensesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Get active type from URL, default to 'all'
  const activeType = searchParams.get("expense_type") || "all";

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
      // Pass the new filter to the query
      expense_type: activeType !== "all" ? activeType : undefined,
    }),
    [searchParams, activeType]
  );

  const { data, isLoading, isError } = useExpenses(queryParams);
  const expenses = data?.data || [];

  // Helper to update URL without losing other filters
  const handleTypeChange = useCallback(
    (type: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (type === "all") {
        params.delete("expense_type");
      } else {
        params.set("expense_type", type);
      }
      params.set("page", "1"); // Reset pagination on filter change
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, pathname, router]
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 max-w-5xl mx-auto">
      {/* --- HEADER SECTION --- */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between px-2">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Expenses
          </h1>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed max-w-md">
            Manage your shared expenses, track balances, and settle up with
            friends and groups.
          </p>
        </div>
        <Button
          asChild
          size="lg"
          className="rounded-xl shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all hover:scale-105"
        >
          <Link href="/dashboard/expenses/new">
            <Plus className="mr-2 h-5 w-5" /> Add Expense
          </Link>
        </Button>
      </div>

      {/* --- CONTROL PANEL (Sticky Filter Bar) --- */}
      <div className="sticky top-4 z-20 space-y-3">
        {/* New Expense Type Toggles */}
        <div className="flex p-1 bg-muted/80 backdrop-blur-md rounded-2xl w-fit border border-border shadow-sm">
          {[
            { id: "all", label: "All Expenses", icon: Receipt },
            { id: "group", label: "Groups", icon: Users },
            { id: "friend", label: "Friends", icon: User },
          ].map((type) => {
            const isActive = activeType === type.id;
            return (
              <button
                key={type.id}
                onClick={() => handleTypeChange(type.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl transition-all duration-200",
                  isActive
                    ? "bg-background text-foreground shadow-sm ring-1 ring-border/50"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                )}
              >
                <type.icon
                  className={cn(
                    "h-4 w-4",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                />
                {type.label}
              </button>
            );
          })}
        </div>

        {/* Existing Filter Bar */}
        <div className="bg-background/80 backdrop-blur-xl p-3 rounded-2xl border border-border shadow-sm ring-1 ring-border/50 transition-all hover:shadow-md hover:border-primary/20">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            {/* Visual Label */}
            <div className="hidden md:flex items-center gap-2 text-muted-foreground text-xs font-bold uppercase tracking-wider pr-4 border-r border-border h-8">
              <SlidersHorizontal className="h-4 w-4" />
              <span>Filters</span>
            </div>

            {/* Filter Component */}
            <div className="flex-1 w-full">
              <FilterBar />
            </div>
          </div>
        </div>
      </div>

      {/* --- CONTENT LIST --- */}
      <div className="rounded-[2rem] border border-border bg-card shadow-sm overflow-hidden min-h-[400px]">
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
            <div className="p-4 bg-destructive/10 rounded-full mb-4">
              <Receipt className="h-8 w-8 text-destructive" />
            </div>
            <h3 className="text-foreground font-bold text-lg mb-1">
              Unable to load expenses
            </h3>
            <p className="text-muted-foreground text-sm mb-6">
              Something went wrong while fetching data.
            </p>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="rounded-xl"
            >
              Retry
            </Button>
          </div>
        ) : expenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center px-4">
            <div className="h-24 w-24 bg-muted/30 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner border border-border transform -rotate-3">
              <Receipt className="h-12 w-12 text-muted-foreground/50" />
            </div>
            <h3 className="text-2xl font-bold text-foreground">
              No expenses found
            </h3>
            <p className="text-muted-foreground max-w-sm mt-2 mb-8 leading-relaxed">
              We couldn't find any expenses matching your filters. Try adjusting
              them or create a new one.
            </p>
            <Button
              variant="secondary"
              onClick={() => {
                handleTypeChange("all");
                router.push("/dashboard/expenses");
              }}
              className="rounded-xl"
            >
              Clear All Filters
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {expenses.map((expense: any) => (
              <Link
                key={expense.id}
                href={`/dashboard/expenses/${expense.id}`}
                className="block"
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
