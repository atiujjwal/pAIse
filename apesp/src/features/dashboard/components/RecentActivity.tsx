"use client";

import { Receipt, ArrowUpRight, ArrowDownLeft, Calendar } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "../../auth/store";
import { useRecentExpenses } from "@/src/components/dashboard/api/dashboard-queries";
import { Skeleton } from "@/src/components/ui/Skeleton";
import { formatCurrency } from "@/src/lib/utils";
import { Button } from "@/src/components/ui/Button";

export function RecentActivity() {
  const { data: expenses, isLoading } = useRecentExpenses();
  const user = useAuthStore((state) => state.user);

  if (isLoading)
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );

  if (!expenses?.length) {
    return (
      <div className="flex h-40 flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/30">
        <Receipt className="mb-2 h-8 w-8 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">No recent activity</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-card shadow-sm">
      <div className="divide-y">
        {expenses.map((expense) => {
          const myPayerRecord = expense.payers.find(
            (p: any) => p.user.id === user?.id
          );
          const mySplitRecord = expense.splits.find(
            (s: any) => s.user.id === user?.id
          );
          const didIPay = !!myPayerRecord;
          const amISplit = !!mySplitRecord;

          let actionText = "Involved";
          let amountDisplay = expense.amount;
          let colorClass = "text-muted-foreground";
          let Icon = Receipt;
          let bgClass = "bg-secondary";

          if (didIPay && !amISplit) {
            actionText = "You lent";
            amountDisplay = expense.amount;
            colorClass = "text-emerald-600";
            bgClass = "bg-emerald-100 dark:bg-emerald-900/30";
            Icon = ArrowUpRight;
          } else if (!didIPay && amISplit) {
            actionText = "You borrowed";
            amountDisplay = mySplitRecord.amount_owed;
            colorClass = "text-rose-600";
            bgClass = "bg-rose-100 dark:bg-rose-900/30";
            Icon = ArrowDownLeft;
          } else if (didIPay && amISplit) {
            const lentAmount = (
              parseFloat(expense.amount) - parseFloat(mySplitRecord.amount_owed)
            ).toFixed(2);
            actionText = "You lent";
            amountDisplay = lentAmount;
            colorClass = "text-emerald-600";
            bgClass = "bg-emerald-100 dark:bg-emerald-900/30";
            Icon = ArrowUpRight;
          }

          return (
            <div
              key={expense.id}
              className="group flex items-center justify-between p-4 transition-colors hover:bg-muted/50"
            >
              <div className="flex items-center gap-4">
                {/* Icon Box */}
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${bgClass} transition-transform group-hover:scale-105`}
                >
                  <Icon className={`h-5 w-5 ${colorClass}`} />
                </div>

                {/* Text Content */}
                <div className="space-y-1">
                  <p className="font-semibold leading-none">
                    {expense.description}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(expense.date).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <span>•</span>
                    <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide">
                      {expense.category}
                    </span>
                  </div>
                </div>
              </div>

              {/* Amount */}
              <div className="text-right">
                <p className={`font-bold tabular-nums ${colorClass}`}>
                  {colorClass.includes("emerald")
                    ? "+"
                    : colorClass.includes("rose")
                    ? "-"
                    : ""}
                  {formatCurrency(
                    String(amountDisplay),
                    expense.currency || "INR"
                  )}
                </p>
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  {actionText}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t p-2">
        <Button
          asChild
          variant="ghost"
          className="w-full text-xs text-muted-foreground hover:text-primary"
        >
          <Link href="/dashboard/expenses">View Full History</Link>
        </Button>
      </div>
    </div>
  );
}
