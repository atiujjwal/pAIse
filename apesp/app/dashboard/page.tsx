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
  Sparkles,
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
      className="group relative flex items-center justify-between p-4 rounded-[1.5rem] border border-border/50 bg-card/50 hover:bg-card hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 backdrop-blur-sm transition-all duration-300"
    >
      <div className="flex items-center gap-4 overflow-hidden">
        <div className="relative">
          <Avatar className="h-12 w-12 border-2 border-background shadow-sm group-hover:border-primary/20 transition-colors">
            <AvatarImage
              src={avatarUrl || undefined}
              className="object-cover"
            />
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
          <div className="absolute -bottom-1 -right-1 p-0.5 bg-card rounded-full">
            <div
              className={cn(
                "p-1 rounded-full text-[8px]",
                isGroupExpense
                  ? "bg-primary/10 text-primary"
                  : "bg-secondary/10 text-secondary"
              )}
            >
              {isGroupExpense ? (
                <Layers className="h-2.5 w-2.5" />
              ) : (
                <User className="h-2.5 w-2.5" />
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col min-w-0">
          <h4 className="font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors">
            {expense.description}
          </h4>

          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>
                {new Date(expense.date).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
            <span className="text-border/60">•</span>
            <span className="capitalize px-1.5 py-0.5 rounded-md bg-muted/50 text-[10px] font-medium border border-border/50">
              {expense.category}
            </span>
          </div>
        </div>
      </div>

      {/* Amount & User Context Section */}
      <div className="text-right pl-2 flex flex-col items-end">
        {/* Total Amount */}
        <span className="block font-mono font-bold text-foreground text-base tracking-tight">
          {formatCurrency(expense.amount, expense.currency)}
        </span>

        {/* User Specific Details */}
        <div className="flex flex-col items-end gap-1 mt-1">
          {paidAmount > 0 && (
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
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
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider bg-muted/50 px-1.5 py-0.5 rounded-md border border-border/50">
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
    className="flex items-center gap-3 p-3 rounded-[1.25rem] border border-border/40 bg-card/30 hover:bg-card hover:border-primary/20 hover:shadow-md transition-all duration-300 group"
  >
    <Avatar className="h-10 w-10 border border-border/50 group-hover:border-primary/30 transition-all">
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
      <p className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
        {user.name}
      </p>
      <p className="text-[11px] font-medium text-muted-foreground">
        {type === "owe" ? "you owe" : "owes you"}
      </p>
    </div>

    <div
      className={cn(
        "text-right font-mono font-bold text-sm px-2.5 py-1 rounded-lg border",
        type === "owe"
          ? "text-destructive bg-destructive/5 border-destructive/10"
          : "text-secondary bg-secondary/5 border-secondary/10"
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
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4 animate-in fade-in zoom-in duration-500">
        <div className="p-6 bg-destructive/5 rounded-full mb-2 ring-1 ring-destructive/20">
          <Receipt className="h-10 w-10 text-destructive" />
        </div>
        <div className="space-y-1">
          <h3 className="font-bold text-lg">Oops! Something went wrong.</h3>
          <p className="text-muted-foreground">
            Failed to load your financial data.
          </p>
        </div>
        <Button
          onClick={() => window.location.reload()}
          variant="outline"
          className="rounded-xl border-border/50"
        >
          Try Again
        </Button>
      </div>
    );
  }

  const recentExpenses = snapshot?.recent_expenses || [];
  const youOwe = snapshot?.you_owe || [];
  const youAreOwed = snapshot?.you_are_owed || [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 max-w-7xl mx-auto">
      {/* --- HEADER --- */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
              Dashboard{" "}
              <Sparkles className="h-6 w-6 text-primary animate-pulse" />
            </h1>
            <p className="text-muted-foreground text-sm font-medium mt-1">
              Your financial command center.
            </p>
          </div>

          {/* Time Range Filter - Controls 'Trends' Query */}
          <div className="flex items-center gap-2 pt-2">
            <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-card border border-border/50 text-muted-foreground shadow-sm">
              <CalendarRange className="h-5 w-5" />
            </div>
            <Select value={range} onValueChange={setRange}>
              <SelectTrigger className="h-10 w-[160px] rounded-xl bg-card border-border/50 text-sm font-semibold shadow-sm focus:ring-primary/20 hover:border-primary/30 transition-all">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border/50 shadow-xl">
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
            className="h-11 rounded-xl border-border/50 bg-card/50 hover:bg-card text-muted-foreground hover:text-foreground backdrop-blur-sm transition-all"
          >
            <Link href="/dashboard/groups?action=create">
              <Users className="mr-2 h-4 w-4" />
              Create Group
            </Link>
          </Button>
          <Button
            asChild
            className="h-11 rounded-xl bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all border-none"
          >
            <Link href="/dashboard/expenses/new">
              <Plus className="mr-2 h-5 w-5" />
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
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              Recent Activity
            </h2>
            <Link
              href="/dashboard/expenses"
              className="text-sm text-primary hover:text-primary/80 font-semibold flex items-center group px-3 py-1.5 rounded-lg hover:bg-primary/5 transition-colors"
            >
              View all{" "}
              <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {loadingSnapshot ? (
              [1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 rounded-[1.5rem]" />
              ))
            ) : recentExpenses.length > 0 ? (
              recentExpenses.map((expense: any) => (
                <RecentActivityCard key={expense.id} expense={expense} />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-16 rounded-[2.5rem] border-2 border-dashed border-border/60 bg-muted/5">
                <div className="p-4 bg-muted/30 rounded-full mb-3 ring-1 ring-border/50">
                  <Receipt className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-sm font-medium">
                  No recent activity found.
                </p>
                <Button variant="link" asChild className="text-primary mt-1">
                  <Link href="/dashboard/expenses/new">
                    Create your first expense
                  </Link>
                </Button>
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
              <Skeleton className="h-24 w-full rounded-[1.5rem]" />
            ) : youAreOwed.length > 0 ? (
              <div className="space-y-3">
                {youAreOwed.map((user: any) => (
                  <BalanceRow key={user.id} user={user} type="owed" />
                ))}
              </div>
            ) : (
              <div className="p-8 text-center border border-border/50 rounded-[2rem] bg-card/30 shadow-sm backdrop-blur-sm">
                <div className="inline-flex p-3 rounded-full bg-secondary/10 mb-3">
                  <TrendingUp className="h-5 w-5 text-secondary" />
                </div>
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
              <Skeleton className="h-24 w-full rounded-[1.5rem]" />
            ) : youOwe.length > 0 ? (
              <div className="space-y-3">
                {youOwe.map((user: any) => (
                  <BalanceRow key={user.id} user={user} type="owe" />
                ))}
              </div>
            ) : (
              <div className="p-8 text-center border border-border/50 rounded-[2rem] bg-card/30 shadow-sm backdrop-blur-sm">
                <div className="inline-flex p-3 rounded-full bg-emerald-500/10 mb-3">
                  <Sparkles className="h-5 w-5 text-emerald-500" />
                </div>
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
