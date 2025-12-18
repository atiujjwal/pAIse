"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  Users,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Layers,
  User,
  Calendar,
  Receipt,
  CalendarRange,
} from "lucide-react";

import { Button } from "@/src/components/ui/Button";
import { Skeleton } from "@/src/components/ui/Skeleton";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/src/components/ui/Avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/Select";
import { formatCurrency, cn } from "@/src/lib/utils";
import {
  useDashboardSnapshot,
  useDashboardTrends,
} from "@/src/features/dashboard/api/dashboard-queries";
import { useAuthStore } from "@/src/features/auth/store";
import { StatsCards } from "@/src/features/dashboard/components/StatsCards";
import { DashboardCharts } from "@/src/features/dashboard/components/DashboardCharts";

// --- LOCAL UI COMPONENTS ---

const RecentActivityCard = ({ expense }: { expense: any }) => {
  const { user } = useAuthStore();
  const isGroupExpense = !!expense.group;

  // 1. Calculate User Specific Financials
  const userPayment = expense.payers.find((p: any) => p.user.id === user?.id);
  const userSplit = expense.splits.find((s: any) => s.user.id === user?.id);

  const paidAmount = userPayment ? parseFloat(userPayment.amount) : 0;
  const shareAmount = userSplit ? parseFloat(userSplit.amount_owed) : 0;

  // 2. Determine Display Avatar & Name
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
    <Link
      href={`/dashboard/expenses/${expense.id}`}
      className="group flex items-center justify-between p-4 rounded-2xl border border-border bg-card shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-200"
    >
      <div className="flex items-center gap-4 overflow-hidden">
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

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
              {expense.description}
            </h4>
            <span
              className={cn(
                "hidden sm:inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium border",
                isGroupExpense
                  ? "bg-primary/5 text-primary border-primary/10"
                  : "bg-secondary/5 text-secondary border-secondary/10"
              )}
            >
              {isGroupExpense ? "Group" : "Friend"}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
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
            <span className="capitalize">{expense.category}</span>
          </div>
        </div>
      </div>

      {/* Amount & User Context Section */}
      <div className="text-right pl-2 flex flex-col items-end">
        {/* Total Amount */}
        <span className="block font-mono font-bold text-foreground text-base">
          {formatCurrency(expense.amount, expense.currency)}
        </span>

        {/* User Specific Details */}
        <div className="flex flex-col items-end gap-0.5 mt-1">
          {paidAmount > 0 && (
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
              You paid {formatCurrency(String(paidAmount), expense.currency)}
            </span>
          )}

          {shareAmount > 0 && (
            <span className="text-[10px] font-medium text-muted-foreground">
              Your share:{" "}
              {formatCurrency(String(shareAmount), expense.currency)}
            </span>
          )}

          {/* Fallback if user is neither payer nor splitter */}
          {paidAmount === 0 && shareAmount === 0 && (
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider bg-muted px-1.5 py-0.5 rounded-md">
              {expense.split_type}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

const BalanceRow = ({ user, type }: { user: any; type: "owe" | "owed" }) => (
  <Link
    href={`/dashboard/friends/${user.id}`}
    className="flex items-center gap-3 p-3 rounded-2xl border border-border bg-card shadow-sm hover:shadow-md hover:border-primary/20 transition-all group"
  >
    <Avatar className="h-10 w-10 border border-border group-hover:border-primary/30 transition-all">
      <AvatarImage src={user.avatar} className="object-cover" />
      <AvatarFallback
        className={cn(
          "font-bold text-xs",
          type === "owe"
            ? "bg-destructive/10 text-destructive"
            : "bg-secondary/10 text-secondary"
        )}
      >
        {user.name?.[0]?.toUpperCase()}
      </AvatarFallback>
    </Avatar>

    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
        {user.name}
      </p>
      <p className="text-xs text-muted-foreground">
        {type === "owe" ? "you owe" : "owes you"}
      </p>
    </div>

    <div
      className={cn(
        "text-right font-mono font-bold text-sm bg-muted/30 px-2 py-1 rounded-lg",
        type === "owe" ? "text-destructive" : "text-secondary"
      )}
    >
      {type === "owe" ? "-" : "+"}
      {formatCurrency(user.net_balance, user.currency)}
    </div>
  </Link>
);

// --- MAIN PAGE ---

export default function DashboardPage() {
  const [range, setRange] = useState("this_month");

  // Snapshot Query (Static - No Filter)
  const {
    data: snapshot,
    isLoading: loadingSnapshot,
    isError: errorSnapshot,
  } = useDashboardSnapshot();

  // Trends Query (Filtered - Reacts to 'range')
  const { data: trends, isLoading: loadingTrends } = useDashboardTrends(range);

  if (errorSnapshot || (!loadingSnapshot && !snapshot)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
        <div className="p-4 bg-destructive/10 rounded-full mb-2">
          <Receipt className="h-8 w-8 text-destructive" />
        </div>
        <p className="text-muted-foreground">Failed to load dashboard data.</p>
        <Button onClick={() => window.location.reload()} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  const recentExpenses = snapshot?.recent_expenses || [];
  const youOwe = snapshot?.you_owe || [];
  const youAreOwed = snapshot?.you_are_owed || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 max-w-7xl mx-auto">
      {/* --- HEADER --- */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              Dashboard
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Your financial snapshot at a glance.
            </p>
          </div>

          {/* Time Range Filter - Controls 'Trends' Query */}
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-muted text-muted-foreground">
              <CalendarRange className="h-4 w-4" />
            </div>
            <Select value={range} onValueChange={setRange}>
              <SelectTrigger className="h-9 w-[160px] rounded-xl bg-card border-border text-sm font-semibold shadow-sm focus:ring-primary/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="this_week">This Week</SelectItem>
                <SelectItem value="this_month">This Month</SelectItem>
                <SelectItem value="this_year">This Year</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            asChild
            variant="outline"
            className="rounded-xl border-border text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <Link href="/dashboard/groups?action=create">
              <Users className="mr-2 h-4 w-4" />
              Create Group
            </Link>
          </Button>
          <Button
            asChild
            className="rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all"
          >
            <Link href="/dashboard/expenses/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Expense
            </Link>
          </Button>
        </div>
      </div>

      {/* --- STATS CARDS --- */}
      <StatsCards
        snapshot={snapshot}
        trends={trends}
        isLoadingSnapshot={loadingSnapshot}
        isLoadingTrends={loadingTrends}
      />

      {/* --- CHARTS SECTION (Replaced 'Analytics' Page) --- */}
      <DashboardCharts data={trends} isLoading={loadingTrends} currency="INR" />

      {/* --- ACTIVITY & BALANCES GRID --- */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* LEFT COLUMN: Recent Activity */}
        <div className="space-y-5">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xl font-bold text-foreground">
              Recent Activity
            </h2>
            <Link
              href="/dashboard/expenses"
              className="text-sm text-primary hover:text-primary/80 font-semibold flex items-center group"
            >
              View all{" "}
              <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {loadingSnapshot ? (
              [1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 rounded-2xl" />
              ))
            ) : recentExpenses.length > 0 ? (
              recentExpenses.map((expense: any) => (
                <RecentActivityCard key={expense.id} expense={expense} />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-12 rounded-[2.5rem] border-2 border-dashed border-border bg-muted/10">
                <div className="p-4 bg-muted/50 rounded-full mb-3">
                  <Receipt className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-sm font-medium">
                  No recent activity found.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Settlement Center */}
        <div className="space-y-8">
          {/* 1. Who owes you */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2 px-1">
              <TrendingUp className="h-5 w-5 text-secondary" />
              Who owes you
            </h2>
            {loadingSnapshot ? (
              <Skeleton className="h-24 w-full rounded-2xl" />
            ) : youAreOwed.length > 0 ? (
              <div className="space-y-3">
                {youAreOwed.map((user: any) => (
                  <BalanceRow key={user.id} user={user} type="owed" />
                ))}
              </div>
            ) : (
              <div className="p-8 text-center border border-border rounded-[2.5rem] bg-card shadow-sm">
                <p className="text-sm text-muted-foreground font-medium">
                  You are all settled up! No one owes you.
                </p>
              </div>
            )}
          </div>

          {/* 2. You owe */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2 px-1">
              <TrendingDown className="h-5 w-5 text-destructive" />
              You owe
            </h2>
            {loadingSnapshot ? (
              <Skeleton className="h-24 w-full rounded-2xl" />
            ) : youOwe.length > 0 ? (
              <div className="space-y-3">
                {youOwe.map((user: any) => (
                  <BalanceRow key={user.id} user={user} type="owe" />
                ))}
              </div>
            ) : (
              <div className="p-8 text-center border border-border rounded-[2.5rem] bg-card shadow-sm">
                <p className="text-sm text-muted-foreground font-medium">
                  You don't owe anyone anything. Great job!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
