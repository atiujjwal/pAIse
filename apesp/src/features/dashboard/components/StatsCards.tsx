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
          <Skeleton key={i} className="h-44 rounded-[2rem]" />
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
      <div className="group relative overflow-hidden rounded-[2rem] bg-card p-6 shadow-sm border border-border hover:shadow-lg transition-all duration-300">
        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
          <CreditCard className="h-24 w-24 text-primary" />
        </div>

        <div className="relative z-10 flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                <CreditCard className="h-5 w-5" />
              </div>
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Total Spent
              </span>
            </div>
            <h3 className="text-3xl font-bold text-foreground tracking-tight">
              {formatCurrency(String(totalSpent), currency)}
            </h3>
          </div>
          <div className="mt-6 pt-4 border-t border-border/50">
            <p className="text-xs text-muted-foreground">
              Across all groups this month
            </p>
          </div>
        </div>
      </div>

      {/* 2. Net Balance */}
      <div className="group relative overflow-hidden rounded-[2rem] bg-card p-6 shadow-sm border border-border hover:shadow-lg transition-all duration-300">
        <div
          className={cn(
            "absolute top-0 right-0 p-6 opacity-10 transition-opacity",
            isPositive ? "text-secondary" : "text-destructive"
          )}
        >
          <Wallet className="h-24 w-24" />
        </div>

        <div className="relative z-10 flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div
                className={cn(
                  "p-2.5 rounded-xl",
                  isPositive
                    ? "bg-secondary/10 text-secondary"
                    : "bg-destructive/10 text-destructive"
                )}
              >
                <Wallet className="h-5 w-5" />
              </div>
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Net Balance
              </span>
            </div>
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
          <div className="mt-6 pt-4 border-t border-border/50">
            <p className="text-xs text-muted-foreground">
              {isPositive ? "You are owed in total" : "You owe in total"}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Budget Used */}
      <div className="group relative overflow-hidden rounded-[2rem] bg-card p-6 shadow-sm border border-border hover:shadow-lg transition-all duration-300">
        <div className="relative z-10 flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-500">
                <PieChart className="h-5 w-5" />
              </div>
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Budget Used
              </span>
            </div>
            <h3 className="text-3xl font-bold text-foreground tracking-tight">
              {budgetUsed}%
            </h3>
          </div>

          <div className="mt-6 space-y-2">
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
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
