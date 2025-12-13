"use client";

import { Wallet, CreditCard, PieChart } from "lucide-react";
import { useDashboardSummary } from "../api/dashboard-queries";
import { formatCurrency, cn } from "@/src/lib/utils";
import { Skeleton } from "@/src/components/ui/Skeleton";

export function StatsCards() {
  const { data, isLoading } = useDashboardSummary();

  if (isLoading)
    return (
      <div className="grid gap-6 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-44 rounded-3xl" />
        ))}
      </div>
    );

  const totalSpent = data?.monthly_metrics?.total_spent ?? 0;
  const balance = data?.total_balance ?? 0;
  const budgetUsed = data?.monthly_metrics?.budget_used_percent ?? 0;
  const currency = "INR";
  const isPositive = Number(balance) >= 0;

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {/* 1. Total Spent */}
      <div className="group relative overflow-hidden rounded-3xl bg-card p-6 shadow-sm border border-border hover:shadow-md transition-all">
        {/* Decorative Blur */}
        <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-primary/10 blur-3xl transition-all group-hover:bg-primary/20" />

        <div className="relative z-10 flex flex-col justify-between h-full">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Total Spent
              </p>
              <h3 className="text-3xl font-bold text-foreground tracking-tight">
                {formatCurrency(String(totalSpent), currency)}
              </h3>
            </div>
            <div className="rounded-xl bg-primary/10 p-3 text-primary">
              <CreditCard className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs text-muted-foreground">
              This month across all groups
            </p>
          </div>
        </div>
      </div>

      {/* 2. Net Balance */}
      <div className="group relative overflow-hidden rounded-3xl bg-card p-6 shadow-sm border border-border hover:shadow-md transition-all">
        <div
          className={cn(
            "absolute -right-6 -top-6 h-32 w-32 rounded-full blur-3xl transition-all",
            isPositive ? "bg-secondary/20" : "bg-destructive/10"
          )}
        />
        <div className="relative z-10 flex flex-col justify-between h-full">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Net Balance
              </p>
              <h3
                className={cn(
                  "text-3xl font-bold tracking-tight",
                  isPositive ? "text-secondary" : "text-destructive"
                )}
              >
                {isPositive ? "+" : ""}
                {formatCurrency(String(balance), currency)}
              </h3>
            </div>
            <div
              className={cn(
                "rounded-xl p-3",
                isPositive
                  ? "bg-secondary/10 text-secondary"
                  : "bg-destructive/10 text-destructive"
              )}
            >
              <Wallet className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs text-muted-foreground font-medium">
              {isPositive ? "You are owed in total" : "You owe in total"}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Budget Used */}
      <div className="group relative overflow-hidden rounded-3xl bg-card p-6 shadow-sm border border-border hover:shadow-md transition-all">
        <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-amber-500/10 blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between h-full">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Budget Used
              </p>
              <h3 className="text-3xl font-bold text-foreground tracking-tight">
                {budgetUsed}%
              </h3>
            </div>
            <div className="rounded-xl bg-amber-500/10 p-3 text-amber-500">
              <PieChart className="h-6 w-6" />
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-1000",
                  budgetUsed > 100
                    ? "bg-destructive"
                    : "bg-gradient-to-r from-amber-400 to-orange-500"
                )}
                style={{ width: `${Math.min(budgetUsed, 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground text-right">
              {budgetUsed > 100 ? "Over budget" : "On track"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
