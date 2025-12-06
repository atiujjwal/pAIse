"use client";

import { ArrowUpRight, Wallet, CreditCard } from "lucide-react";
import { useDashboardSummary } from "../api/dashboard-queries";
import { formatCurrency } from "@/src/lib/utils";
import { Skeleton } from "@/src/components/ui/Skeleton";

export function StatsCards() {
  const { data, isLoading } = useDashboardSummary();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    );
  }

  // FIXED: Accessing the nested properties from your actual JSON
  const totalSpent = data?.monthly_metrics?.total_spent ?? 0;
  const balance = data?.total_balance ?? 0;
  const budgetUsed = data?.monthly_metrics?.budget_used_percent ?? 0;
  const remaining = data?.monthly_metrics?.remaining ?? 0;

  // Default to INR since currency is not in the summary root
  const currency = "INR";
  const isPositive = balance >= 0;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {/* Total Spent Card */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">
            Total Spent (Month)
          </h3>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="mt-2 text-2xl font-bold">
          {formatCurrency(String(totalSpent), currency)}
        </div>
      </div>

      {/* Net Balance Card */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">
            Net Balance
          </h3>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </div>
        <div
          className={`mt-2 text-2xl font-bold ${
            isPositive ? "text-green-600" : "text-red-600"
          }`}
        >
          {isPositive ? "+" : ""}
          {formatCurrency(String(balance), currency)}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {isPositive ? "You are owed" : "You owe"}
        </p>
      </div>

      {/* Budget/Limit Card */}
      <div className="rounded-xl border bg-primary/5 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-primary">Budget Used</h3>
          <ArrowUpRight className="h-4 w-4 text-primary" />
        </div>
        <div className="mt-2 text-2xl font-bold text-primary">
          {budgetUsed}%
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {formatCurrency(String(remaining), currency)} remaining
        </p>
      </div>
    </div>
  );
}