"use client";

import Link from "next/link";
import {
  Plus,
  Users,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Wallet,
  CalendarClock,
  ArrowRight,
  Receipt,
} from "lucide-react";

import { Button } from "@/src/components/ui/Button";
import { Skeleton } from "@/src/components/ui/Skeleton";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/src/components/ui/Avatar";
import { formatCurrency, cn } from "@/src/lib/utils";
import { useDashboardSummary } from "@/src/features/dashboard/api/dashboard-queries";

// --- LOCAL UI COMPONENTS ---

const RecentActivityCard = ({ expense }: { expense: any }) => {
  const isGroup = !!expense.group;
  const avatarUrl = isGroup ? expense.group.avatar : expense.created_by.avatar;
  const name = isGroup ? expense.group.name : expense.description;

  return (
    <Link
      href={`/dashboard/expenses/${expense.id}`}
      className="flex items-center gap-3 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors px-2 -mx-2 rounded-lg group"
    >
      <Avatar className="h-9 w-9 border border-slate-100 group-hover:border-indigo-100 transition-colors">
        <AvatarImage src={avatarUrl} className="object-cover" />
        <AvatarFallback
          className={cn(
            "text-xs font-bold",
            isGroup
              ? "bg-indigo-50 text-indigo-600"
              : "bg-slate-100 text-slate-600"
          )}
        >
          {name?.[0]?.toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
          {expense.description}
        </p>
        <p className="text-[11px] text-slate-500 truncate">
          {isGroup ? `${expense.group.name} • ` : ""}
          {new Date(expense.date).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          })}
        </p>
      </div>
      <div className="text-right">
        <span className="block text-sm font-bold text-slate-900 font-mono">
          {formatCurrency(expense.amount, expense.currency)}
        </span>
        <span className="text-[10px] text-slate-400 capitalize">
          {expense.category}
        </span>
      </div>
    </Link>
  );
};

const BalanceRow = ({ user, type }: { user: any; type: "owe" | "owed" }) => (
  <Link
    href={`/dashboard/friends/${user.id}`}
    className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-white shadow-sm transition-all hover:shadow-md hover:border-slate-200 group"
  >
    <Avatar className="h-10 w-10 border border-transparent group-hover:border-slate-100 transition-all">
      <AvatarImage src={user.avatar} className="object-cover" />
      <AvatarFallback
        className={cn(
          "font-bold",
          type === "owe"
            ? "bg-rose-50 text-rose-600"
            : "bg-emerald-50 text-emerald-600"
        )}
      >
        {user.name?.[0]?.toUpperCase()}
      </AvatarFallback>
    </Avatar>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-primary transition-colors">
        {user.name}
      </p>
      <p className="text-xs text-slate-500">
        {type === "owe" ? "you owe" : "owes you"}
      </p>
    </div>
    <div
      className={cn(
        "text-right font-mono font-bold text-sm",
        type === "owe" ? "text-rose-600" : "text-emerald-600"
      )}
    >
      {type === "owe" ? "-" : "+"}
      {formatCurrency(user.net_balance, user.currency)}
    </div>
  </Link>
);

// --- MAIN PAGE ---

export default function DashboardPage() {
  const { data: summary, isLoading, isError } = useDashboardSummary();

  if (isLoading) {
    return (
      <div className="space-y-8 pt-4 pb-20 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 rounded-3xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Skeleton className="h-96 rounded-3xl" />
          <div className="space-y-6">
            <Skeleton className="h-40 rounded-3xl" />
            <Skeleton className="h-40 rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !summary) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <p className="text-slate-500 mb-4">Failed to load dashboard data.</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  // Safe Type Casting & Defaulting
  const totalBalance = parseFloat(String(summary.total_balance));
  const metrics = summary.monthly_metrics;
  const subscriptions = summary.upcoming_subscriptions || [];
  const recentExpenses = summary.recent_expenses || [];
  const youOwe = summary.you_owe || [];
  const youAreOwed = summary.you_are_owed || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 max-w-6xl mx-auto">
      {/* --- HEADER --- */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Dashboard
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Your financial snapshot at a glance.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            asChild
            variant="outline"
            className="border-slate-200 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <Link href="/dashboard/groups?action=create">
              <Users className="mr-2 h-4 w-4 text-slate-500" />
              Create Group
            </Link>
          </Button>
          <Button
            asChild
            className="shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all"
          >
            <Link href="/dashboard/expenses/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Expense
            </Link>
          </Button>
        </div>
      </div>

      {/* --- STATS CARDS --- */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* 1. Total Balance */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-500">
              Total Balance
            </h3>
            <div className="p-2 bg-slate-50 rounded-full">
              <Wallet className="h-4 w-4 text-slate-400" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span
              className={cn(
                "text-3xl font-extrabold tracking-tight",
                totalBalance >= 0 ? "text-emerald-600" : "text-rose-600"
              )}
            >
              {totalBalance >= 0 ? "+" : ""}
              {summary.total_balance}
            </span>
            <span className="text-sm font-semibold text-slate-400">INR</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Net balance across all friends & groups
          </p>
        </div>

        {/* 2. Monthly Spending */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-500">
              Monthly Spending
            </h3>
            <div className="p-2 bg-slate-50 rounded-full">
              <CreditCard className="h-4 w-4 text-slate-400" />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-2 font-medium">
              <span className="text-slate-900">
                {formatCurrency(metrics.total_spent.toString(), "INR")}
              </span>
              <span className="text-slate-400">
                / {formatCurrency(metrics.budget_limit.toString(), "INR")}
              </span>
            </div>
            {/* Progress Bar */}
            <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-1000 ease-out",
                  metrics.budget_used_percent > 100
                    ? "bg-rose-500"
                    : "bg-indigo-500"
                )}
                style={{
                  width: `${Math.min(metrics.budget_used_percent, 100)}%`,
                }}
              />
            </div>
            <p className="mt-2 text-xs text-slate-400 text-right font-medium">
              {metrics.budget_used_percent}% of budget used
            </p>
          </div>
        </div>

        {/* 3. Upcoming Subscriptions */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-500">
              Upcoming Bill(Pending Feature)
            </h3>
            <div className="p-2 bg-slate-50 rounded-full">
              <CalendarClock className="h-4 w-4 text-slate-400" />
            </div>
          </div>
          {subscriptions.length > 0 ? (
            <div className="mt-3">
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-slate-900 truncate max-w-[120px]">
                  {subscriptions[0].name}
                </span>
                <span className="font-mono text-sm font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                  {formatCurrency(subscriptions[0].amount, "INR")}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Due on{" "}
                {new Date(
                  subscriptions[0].next_charge_date
                ).toLocaleDateString()}
              </p>
            </div>
          ) : (
            <div className="mt-4 flex items-center gap-2 text-sm text-slate-400 italic">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              No upcoming bills
            </div>
          )}
        </div>
      </div>

      {/* --- MAIN GRID --- */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* LEFT COLUMN: Recent Activity */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-bold text-slate-900">
              Recent Activity
            </h2>
            <Link
              href="/dashboard/expenses"
              className="text-sm text-indigo-600 hover:text-indigo-700 font-semibold flex items-center group"
            >
              View all{" "}
              <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm min-h-[400px]">
            {recentExpenses.length > 0 ? (
              <div className="flex flex-col gap-1">
                {recentExpenses.map((expense: any) => (
                  <RecentActivityCard key={expense.id} expense={expense} />
                ))}
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center py-10 opacity-60">
                <div className="p-4 bg-slate-50 rounded-full mb-3">
                  <Receipt className="h-6 w-6 text-slate-400" />
                </div>
                <p className="text-slate-500 text-sm font-medium">
                  No recent activity found.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Settlement Center */}
        <div className="space-y-8">
          {/* 1. Who owes you */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 px-1">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              Who owes you
            </h2>
            {youAreOwed.length > 0 ? (
              <div className="space-y-3">
                {youAreOwed.map((user: any) => (
                  <BalanceRow key={user.id} user={user} type="owed" />
                ))}
              </div>
            ) : (
              <div className="p-8 text-center border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                <p className="text-sm text-slate-400 font-medium">
                  You are all settled up!
                </p>
              </div>
            )}
          </div>

          {/* 2. You owe */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 px-1">
              <TrendingDown className="h-5 w-5 text-rose-500" />
              You owe
            </h2>
            {youOwe.length > 0 ? (
              <div className="space-y-3">
                {youOwe.map((user: any) => (
                  <BalanceRow key={user.id} user={user} type="owe" />
                ))}
              </div>
            ) : (
              <div className="p-8 text-center border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                <p className="text-sm text-slate-400 font-medium">
                  You don't owe anyone.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
