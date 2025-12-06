"use client";

import { ArrowUpRight, Wallet, CreditCard, PieChart } from "lucide-react";
import { useDashboardSummary } from "../api/dashboard-queries";
import { formatCurrency } from "@/src/lib/utils";
import { Skeleton } from "@/src/components/ui/Skeleton";

export function StatsCards() {
  const { data, isLoading } = useDashboardSummary();

  if (isLoading)
    return (
      <div className="grid gap-6 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-40 rounded-2xl" />
        ))}
      </div>
    );

  const totalSpent = data?.monthly_metrics?.total_spent ?? 0;
  const balance = data?.total_balance ?? 0;
  const budgetUsed = data?.monthly_metrics?.budget_used_percent ?? 0;
  const currency = "INR";
  const isPositive = balance >= 0;

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {/* Total Spent - Glass Card */}
      <div className="group relative overflow-hidden rounded-2xl bg-white/70 p-6 shadow-soft backdrop-blur-xl transition-all hover:-translate-y-1 hover:shadow-lg border border-white/50">
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-blue-100/50 blur-xl transition-all group-hover:bg-blue-200/50" />
        <div className="relative">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">
              Total Spent
            </p>
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
              <CreditCard className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <h3 className="text-3xl font-bold text-slate-800">
              {formatCurrency(String(totalSpent), currency)}
            </h3>
          </div>
        </div>
      </div>

      {/* Net Balance - Gradient Border Effect */}
      <div className="group relative overflow-hidden rounded-2xl bg-white/70 p-6 shadow-soft backdrop-blur-xl transition-all hover:-translate-y-1 hover:shadow-lg border border-white/50">
        <div
          className={`absolute -right-6 -top-6 h-24 w-24 rounded-full blur-xl transition-all ${
            isPositive ? "bg-emerald-100/50" : "bg-red-100/50"
          }`}
        />
        <div className="relative">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">
              Net Balance
            </p>
            <div
              className={`rounded-lg p-2 ${
                isPositive
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-red-50 text-red-600"
              }`}
            >
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          <h3
            className={`mt-4 text-3xl font-bold ${
              isPositive ? "text-emerald-600" : "text-red-600"
            }`}
          >
            {isPositive ? "+" : ""}
            {formatCurrency(String(balance), currency)}
          </h3>
          <p className="mt-1 text-xs font-medium text-slate-400">
            {isPositive ? "You are owed" : "You owe"}
          </p>
        </div>
      </div>

      {/* Budget - Circular Progress Vibe */}
      <div className="group relative overflow-hidden rounded-2xl bg-white/70 p-6 shadow-soft backdrop-blur-xl transition-all hover:-translate-y-1 hover:shadow-lg border border-white/50">
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-orange-100/50 blur-xl" />
        <div className="relative">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">
              Budget Used
            </p>
            <div className="rounded-lg bg-orange-50 p-2 text-orange-600">
              <PieChart className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-end justify-between">
              <h3 className="text-3xl font-bold text-slate-800">
                {budgetUsed}%
              </h3>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full bg-gradient-to-r from-orange-400 to-red-400 transition-all duration-1000"
                style={{ width: `${Math.min(budgetUsed, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
