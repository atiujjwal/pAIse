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
import { ExpenseFeed } from "@/src/components/expenses/ExpenseFeed";
import { formatCurrency, cn } from "@/src/lib/utils";
import { useAuthStore } from "@/src/features/auth/store";

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
      <div className="min-h-[400px]">
        <ExpenseFeed
          expenses={expenses}
          isLoading={isLoading}
          isError={isError}
        />
      </div>
    </div>
  );
}
