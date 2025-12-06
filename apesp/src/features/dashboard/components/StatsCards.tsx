"use client";

import { useDashboardSummary } from "@/src/components/dashboard/api/dashboard-queries";
import { Skeleton } from "@/src/components/ui/Skeleton";
import { formatCurrency } from "@/src/lib/utils";
import { ArrowUpRight, ArrowDownRight, Wallet, CreditCard } from "lucide-react";


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

  const balance = parseFloat(data?.outstanding_balance || "0");
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
          {formatCurrency(data?.total_spent || "0", data?.currency)}
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
          {formatCurrency(String(balance), data?.currency)}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {isPositive ? "You are owed" : "You owe"}
        </p>
      </div>

      {/* Quick Action Placeholder (or Savings) */}
      <div className="rounded-xl border bg-primary/5 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-primary">Savings Goal</h3>
          <ArrowUpRight className="h-4 w-4 text-primary" />
        </div>
        <div className="mt-2 text-2xl font-bold text-primary">85%</div>
        <p className="text-xs text-muted-foreground mt-1">
          On track for "Vacation"
        </p>
      </div>
    </div>
  );
}
