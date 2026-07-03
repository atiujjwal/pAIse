"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Layers,
  User,
  Receipt,
  ArrowRight,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useAuthStore } from "@/src/features/auth/store";
import { Avatar, AvatarFallback, AvatarImage } from "@/src/components/ui/Avatar";
import { Skeleton } from "@/src/components/ui/Skeleton";
import { formatCurrency, cn } from "@/src/lib/utils";

interface ExpenseFeedProps {
  expenses: any[];
  isLoading: boolean;
  isError: boolean;
}

// Format date into human-readable headers (e.g. "Today", "Yesterday", or "June 25, 2026")
const getGroupHeader = (dateString: string) => {
  const d = new Date(dateString);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) {
    return "Today";
  } else if (d.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  } else {
    return d.toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
};

export function ExpenseFeed({ expenses, isLoading, isError }: ExpenseFeedProps) {
  const { user } = useAuthStore();

  // Group expenses by formatted date header
  const groupedExpenses = useMemo(() => {
    if (!expenses || expenses.length === 0) return [];
    
    const groups: { [key: string]: any[] } = {};
    expenses.forEach((expense) => {
      const header = getGroupHeader(expense.date);
      if (!groups[header]) {
        groups[header] = [];
      }
      groups[header].push(expense);
    });

    return Object.entries(groups).map(([date, items]) => ({
      date,
      items,
    }));
  }, [expenses]);

  if (isLoading) {
    return (
      <div className="space-y-8 p-1">
        {[1, 2, 3].map((g) => (
          <div key={g} className="space-y-4">
            <Skeleton className="h-6 w-32 rounded-lg bg-muted/40" />
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-5 rounded-3xl border border-border/40 bg-card/30"
                >
                  <div className="flex items-center gap-4 w-2/3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-20 rounded-lg" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-20 text-center px-4"
      >
        <div className="p-4 bg-destructive/10 rounded-full mb-4 border border-destructive/20 text-destructive">
          <Receipt className="h-8 w-8" />
        </div>
        <h3 className="text-foreground font-bold text-lg mb-1">
          Unable to load feed
        </h3>
        <p className="text-muted-foreground text-sm max-w-xs">
          Something went wrong while fetching the expense activity feed.
        </p>
      </motion.div>
    );
  }

  if (expenses.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-24 text-center px-4"
      >
        <div className="h-24 w-24 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-[2.5rem] flex items-center justify-center mb-6 shadow-sm border border-border/50 transform -rotate-3 hover:rotate-0 transition-transform duration-300">
          <Receipt className="h-10 w-10 text-muted-foreground/60" />
        </div>
        <h3 className="text-2xl font-bold text-foreground tracking-tight">
          No expenses recorded
        </h3>
        <p className="text-muted-foreground max-w-sm mt-2 mb-8 text-sm leading-relaxed">
          There are no expenses in this feed matching your criteria. Let's record one to get started!
        </p>
        <Link href="/dashboard/expenses/new">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-primary text-primary-foreground font-semibold shadow-md hover:bg-primary/95 transition-all text-sm"
          >
            Create first expense
          </motion.button>
        </Link>
      </motion.div>
    );
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100, damping: 15 } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
  };

  return (
    <div className="space-y-8">
      <AnimatePresence mode="popLayout">
        {groupedExpenses.map((group) => (
          <motion.div
            key={group.date}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            {/* Sticky Group Header */}
            <div className="sticky top-[140px] md:top-[120px] z-10 py-1 bg-gradient-to-b from-background via-background/95 to-transparent">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest bg-muted/60 border border-border/40 px-3 py-1.5 rounded-xl backdrop-blur-md">
                {group.date}
              </span>
            </div>

            {/* Expenses List */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="space-y-3"
            >
              {group.items.map((expense) => {
                const isGroupExpense = !!expense.group;

                // User Financials
                const userPayment = expense.payers?.find((p: any) => p.user.id === user?.id);
                const userSplit = expense.splits?.find((s: any) => s.user.id === user?.id);
                const paidAmount = userPayment ? parseFloat(userPayment.amount) : 0;
                const shareAmount = userSplit ? parseFloat(userSplit.amount_owed) : 0;

                // Determine display Avatar & Name
                let avatarUrl: string | null | undefined = null;
                let displayName: string = "";
                let FallbackIcon = User;

                if (isGroupExpense) {
                  avatarUrl = expense.group.avatar;
                  displayName = expense.group.name;
                  FallbackIcon = Layers;
                } else {
                  const otherPerson = expense.splits?.find(
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
                  <motion.div
                    key={expense.id}
                    variants={itemVariants}
                    layoutId={`expense-card-${expense.id}`}
                    whileHover={{ y: -2, scale: 1.005 }}
                    whileTap={{ scale: 0.995 }}
                    className="group"
                  >
                    <Link
                      href={`/dashboard/expenses/${expense.id}`}
                      className="flex items-center justify-between p-4 md:p-5 rounded-[2rem] border border-border/40 bg-card/40 hover:bg-card hover:border-primary/20 hover:shadow-xl hover:shadow-primary/[0.02] backdrop-blur-md transition-all duration-300 relative overflow-hidden"
                    >
                      {/* Left side: Avatar + Description/Metadata */}
                      <div className="flex items-center gap-4 overflow-hidden">
                        <div className="relative">
                          <Avatar className="h-12 w-12 border-2 border-background shadow-md transition-all duration-300 group-hover:scale-105 group-hover:border-primary/20">
                            <AvatarImage src={avatarUrl || undefined} className="object-cover" />
                            <AvatarFallback
                              className={cn(
                                "text-xs font-bold transition-colors duration-300",
                                isGroupExpense
                                  ? "bg-primary/10 text-primary group-hover:bg-primary/20"
                                  : "bg-secondary/10 text-secondary group-hover:bg-secondary/20"
                              )}
                            >
                              {displayName?.[0]?.toUpperCase() || (
                                <FallbackIcon className="h-5 w-5" />
                              )}
                            </AvatarFallback>
                          </Avatar>
                          
                          {/* Small category badge overlay */}
                          <div className="absolute -bottom-1.5 -right-1.5 p-0.5 bg-card rounded-full border border-border/30 shadow-sm">
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
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm md:text-base text-foreground truncate group-hover:text-primary transition-colors duration-300">
                              {expense.description}
                            </h4>
                            <span
                              className={cn(
                                "hidden sm:inline-flex items-center rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest border transition-all duration-300",
                                isGroupExpense
                                  ? "bg-primary/5 text-primary border-primary/10 group-hover:bg-primary/10"
                                  : "bg-secondary/5 text-secondary border-secondary/10 group-hover:bg-secondary/10"
                              )}
                            >
                              {isGroupExpense ? "Group" : "Friend"}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                            <span className="capitalize px-2 py-0.5 rounded-lg bg-muted/60 text-[10px] font-semibold border border-border/40">
                              {expense.category}
                            </span>
                            <span className="text-border/60">•</span>
                            <span className="truncate font-medium">
                              {isGroupExpense ? expense.group.name : displayName}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right side: Amount + Split State */}
                      <div className="text-right pl-2 flex flex-col items-end shrink-0">
                        {/* Total expense amount */}
                        <span className="block font-mono font-bold text-foreground text-base md:text-lg tracking-tight group-hover:text-primary transition-colors">
                          {formatCurrency(expense.amount, expense.currency)}
                        </span>

                        {/* User context badge */}
                        <div className="flex flex-col items-end gap-1 mt-1.5">
                          {paidAmount > 0 ? (
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/10 flex items-center gap-1 shadow-sm">
                              <TrendingUp className="h-2.5 w-2.5" />
                              You paid {formatCurrency(String(paidAmount), expense.currency)}
                            </span>
                          ) : shareAmount > 0 ? (
                            <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/10 flex items-center gap-1 shadow-sm">
                              <TrendingDown className="h-2.5 w-2.5" />
                              You owe {formatCurrency(String(shareAmount), expense.currency)}
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full border border-border/40 uppercase tracking-widest">
                              Not Involved
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
