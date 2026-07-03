"use client";

import {
  Wallet,
  CreditCard,
  Users,
  User,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";
import { Skeleton } from "@/src/components/ui/Skeleton";
import { formatCurrency, cn } from "@/src/lib/utils";
import { DashboardSnapshot, DashboardTrends } from "../api/dashboard-queries";

interface StatsCardsProps {
  snapshot?: DashboardSnapshot;
  trends?: DashboardTrends;
  isLoadingSnapshot: boolean;
  isLoadingTrends: boolean;
}

export function StatsCards({
  snapshot,
  trends,
  isLoadingSnapshot,
  isLoadingTrends,
}: StatsCardsProps) {
  // Parse Snapshot Data
  const netBalance = parseFloat(snapshot?.total_balance || "0");
  const groupNet = parseFloat(snapshot?.group_net_balance || "0");
  const friendNet = parseFloat(snapshot?.friend_net_balance || "0");

  // Parse Trends Data
  const totalSpent = trends?.spending_analysis?.total_money_spent || 0;
  const groupSpent = trends?.spending_analysis?.group_money_spent || 0;
  const friendSpent = trends?.spending_analysis?.friend_money_spent || 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* --- CARD : BALANCE OVERVIEW --- */}
      {isLoadingSnapshot ? (
        <Skeleton className="h-[280px] rounded-[2.5rem]" />
      ) : (
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-primary to-secondary p-5 sm:p-8 text-white shadow-xl shadow-primary/20 flex flex-col justify-between min-h-[280px]">
          {/* Decorative Background */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none" />

          {/* Top Section: Total Net */}
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-2xl shadow-sm border border-white/10">
                <Wallet className="h-5 w-5 text-white" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest opacity-90">
                Total Net Balance
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl sm:text-4xl md:text-5xl font-mono font-bold tracking-tighter drop-shadow-sm truncate">
                {formatCurrency(String(netBalance), "INR")}
              </h3>
            </div>
            <p className="text-sm text-white/80 mt-2 font-medium flex items-center gap-1.5">
              {netBalance >= 0 ? (
                <>
                  <ArrowUpRight className="h-4 w-4 text-emerald-200" /> You are
                  owed overall
                </>
              ) : (
                <>
                  <ArrowDownLeft className="h-4 w-4 text-rose-200" /> You owe
                  overall
                </>
              )}
            </p>
          </div>

          {/* Bottom Section: Breakdown Grid */}
          <div className="relative z-10 mt-8 grid grid-cols-2 gap-3 sm:gap-4">
            {/* Groups Block */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 sm:p-4 border border-white/10 flex flex-col gap-1 transition-colors hover:bg-white/20 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-3.5 w-3.5 opacity-80" />
                <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">
                  Groups
                </span>
              </div>
              <span
                className={cn(
                  "text-base sm:text-lg md:text-xl font-mono font-bold truncate",
                  groupNet >= 0 ? "text-emerald-100" : "text-rose-100"
                )}
              >
                {groupNet > 0 ? "+" : ""}
                {formatCurrency(String(groupNet), "INR")}
              </span>
            </div>

            {/* Friends Block */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 sm:p-4 border border-white/10 flex flex-col gap-1 transition-colors hover:bg-white/20 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <User className="h-3.5 w-3.5 opacity-80" />
                <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">
                  Friends
                </span>
              </div>
              <span
                className={cn(
                  "text-base sm:text-lg md:text-xl font-mono font-bold truncate",
                  friendNet >= 0 ? "text-emerald-100" : "text-rose-100"
                )}
              >
                {friendNet > 0 ? "+" : ""}
                {formatCurrency(String(friendNet), "INR")}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* --- CARD: SPENDING ANALYSIS  --- */}
      <div className="rounded-[2.5rem] border border-border bg-card p-5 sm:p-8 shadow-sm flex flex-col justify-between min-h-[280px]">
        <div className="flex items-start justify-between mb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-500/10 rounded-2xl text-rose-500">
                <CreditCard className="h-5 w-5" />
              </div>
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Total Spending
              </span>
            </div>
            {isLoadingTrends ? (
              <Skeleton className="h-10 w-48 mt-3 rounded-lg" />
            ) : (
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mt-3 font-mono tracking-tight animate-in fade-in truncate">
                {formatCurrency(String(totalSpent), "INR")}
              </h3>
            )}
          </div>

          {/* Period Badge */}
          <span className="px-3 py-1.5 bg-muted/50 rounded-xl text-[10px] font-bold text-muted-foreground uppercase tracking-wide border border-border">
            {trends?.spending_analysis?.period?.replace("_", " ") ||
              "This Month"}
          </span>
        </div>

        {isLoadingTrends ? (
          <div className="space-y-4">
            <Skeleton className="h-4 w-full rounded-full" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-12 rounded-xl" />
              <Skeleton className="h-12 rounded-xl" />
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium text-muted-foreground">
                <span>Distribution</span>
                <span>{totalSpent > 0 ? "100%" : "0%"}</span>
              </div>
              {/* Progress Bar */}
              <div className="w-full bg-muted/50 h-3 rounded-full overflow-hidden flex">
                <div
                  className="bg-primary h-full transition-all duration-500"
                  style={{
                    width: `${
                      totalSpent > 0 ? (groupSpent / totalSpent) * 100 : 0
                    }%`,
                  }}
                />
                <div
                  className="bg-secondary h-full transition-all duration-500"
                  style={{
                    width: `${
                      totalSpent > 0 ? (friendSpent / totalSpent) * 100 : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            {/* Legend Grid */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  Group Expenses
                </div>
                <span className="text-base sm:text-lg font-bold text-foreground pl-2 sm:pl-4 truncate">
                  {formatCurrency(String(groupSpent), "INR")}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <span className="w-2 h-2 rounded-full bg-secondary" />
                  Direct Expenses
                </div>
                <span className="text-base sm:text-lg font-bold text-foreground pl-2 sm:pl-4 truncate">
                  {formatCurrency(String(friendSpent), "INR")}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
