"use client";

import { ArrowUpRight, Wallet, CreditCard, TrendingUp } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { useDashboardSummary } from "../api/dashboard-queries";
import { formatCurrency } from "@/src/lib/utils";
import { Skeleton } from "@/src/components/ui/Skeleton";

export function StatsCards() {
  const { data, isLoading } = useDashboardSummary();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-36 rounded-2xl" />
        ))}
      </div>
    );
  }

  const totalSpent = data?.monthly_metrics?.total_spent ?? 0;
  const balance = data?.total_balance ?? 0;
  const budgetUsed = data?.monthly_metrics?.budget_used_percent ?? 0;
  const remaining = data?.monthly_metrics?.remaining ?? 0;
  const currency = "INR";
  const isPositive = balance >= 0;

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {/* Total Spent Card */}
      <div className="relative overflow-hidden rounded-2xl border bg-card p-6 shadow-sm transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Spent (Month)</p>
            <h3 className="mt-2 text-3xl font-bold tracking-tight">
              {formatCurrency(String(totalSpent), currency)}
            </h3>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/20">
            <CreditCard className="h-6 w-6" />
          </div>
        </div>
        <div className="mt-4 flex items-center text-xs text-muted-foreground">
          <span className="flex items-center text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-medium mr-2 dark:bg-emerald-900/20">
            +12%
          </span>
          vs last month
        </div>
      </div>

      {/* Net Balance Card */}
      <div className="relative overflow-hidden rounded-2xl border bg-card p-6 shadow-sm transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Net Balance</p>
            <h3 className={cn(
              "mt-2 text-3xl font-bold tracking-tight",
              isPositive ? "text-emerald-600" : "text-rose-600"
            )}>
              {isPositive ? "+" : ""}
              {formatCurrency(String(balance), currency)}
            </h3>
          </div>
          <div className={cn(
            "flex h-12 w-12 items-center justify-center rounded-xl",
            isPositive ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20" : "bg-rose-50 text-rose-600 dark:bg-rose-900/20"
          )}>
            <Wallet className="h-6 w-6" />
          </div>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          {isPositive ? "You are owed by friends" : "You owe friends"}
        </p>
      </div>

      {/* Budget Card */}
      <div className="relative overflow-hidden rounded-2xl border bg-card p-6 shadow-sm transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Budget Used</p>
            <div className="mt-2 flex items-baseline gap-2">
              <h3 className="text-3xl font-bold tracking-tight">{budgetUsed}%</h3>
            </div>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-900/20">
            <TrendingUp className="h-6 w-6" />
          </div>
        </div>
        <div className="mt-4 h-2 w-full rounded-full bg-secondary">
          <div 
            className="h-full rounded-full bg-primary transition-all duration-500" 
            style={{ width: `${Math.min(budgetUsed, 100)}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {formatCurrency(String(remaining), currency)} remaining
        </p>
      </div>
    </div>
  );
}
