"use client";

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
import { useAuthStore } from "@/src/features/auth/store";
import { StatsCards } from "@/src/features/dashboard/components/StatsCards";

// --- LOCAL UI COMPONENTS ---

const RecentActivityCard = ({ expense }: { expense: any }) => {
  const { user } = useAuthStore();
  const isGroupExpense = !!expense.group;

  // Resolve Avatar & Name Logic
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
        {/* Dynamic Avatar Section */}
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

        {/* Main Content */}
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
            <span className="text-border">•</span>
            <span className="truncate max-w-[80px]">
              {isGroupExpense ? expense.group.name : displayName}
            </span>
          </div>
        </div>
      </div>

      {/* Amount Section */}
      <div className="text-right pl-2">
        <span className="block font-mono font-bold text-foreground text-base">
          {formatCurrency(expense.amount, expense.currency)}
        </span>
        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider bg-muted px-1.5 py-0.5 rounded-md mt-1 inline-block">
          {expense.split_type}
        </span>
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
  const { data: summary, isLoading, isError } = useDashboardSummary();

  if (isLoading) {
    return (
      <div className="space-y-8 max-w-7xl mx-auto">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-48 rounded-xl" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32 rounded-xl" />
            <Skeleton className="h-10 w-32 rounded-xl" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 rounded-3xl" />
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
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
        <p className="text-muted-foreground">Failed to load dashboard data.</p>
        <Button onClick={() => window.location.reload()} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  const recentExpenses = summary.recent_expenses || [];
  const youOwe = summary.you_owe || [];
  const youAreOwed = summary.you_are_owed || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 max-w-7xl mx-auto">
      {/* --- HEADER --- */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Your financial snapshot at a glance.
          </p>
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

      {/* --- STATS CARDS (Imported Component) --- */}
      <StatsCards />

      {/* --- MAIN GRID --- */}
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
            {recentExpenses.length > 0 ? (
              recentExpenses.map((expense: any) => (
                <RecentActivityCard key={expense.id} expense={expense} />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-16 rounded-3xl border-2 border-dashed border-border bg-muted/10">
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
            {youAreOwed.length > 0 ? (
              <div className="space-y-3">
                {youAreOwed.map((user: any) => (
                  <BalanceRow key={user.id} user={user} type="owed" />
                ))}
              </div>
            ) : (
              <div className="p-8 text-center border border-border rounded-3xl bg-card shadow-sm">
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
            {youOwe.length > 0 ? (
              <div className="space-y-3">
                {youOwe.map((user: any) => (
                  <BalanceRow key={user.id} user={user} type="owe" />
                ))}
              </div>
            ) : (
              <div className="p-8 text-center border border-border rounded-3xl bg-card shadow-sm">
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
