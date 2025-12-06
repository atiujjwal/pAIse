"use client";


import { useRecentExpenses } from "@/src/components/dashboard/api/dashboard-queries";
import { Receipt, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "../../auth/store";
import { formatCurrency } from "@/src/lib/utils";
import { Button } from "@/src/components/ui/Button";
import { Skeleton } from "@/src/components/ui/Skeleton";

export function RecentActivity() {
  const { data: expenses, isLoading } = useRecentExpenses();
  const user = useAuthStore((state) => state.user);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (!expenses || expenses.length === 0) {
    return (
      <div className="flex h-32 flex-col items-center justify-center rounded-lg border border-dashed text-muted-foreground">
        <Receipt className="mb-2 h-8 w-8 opacity-20" />
        <p>No recent activity</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {expenses.map((expense) => {
        // Logic to determine context: "Did I pay?" vs "Am I involved?"
        const myPayerRecord = expense.payers.find(
          (p: any) => p.user_id === user?.id
        );
        const mySplitRecord = expense.splits.find(
          (s: any) => s.user_id === user?.id
        );

        const didIPay = !!myPayerRecord;
        const amISplit = !!mySplitRecord;

        // Simple heuristic for display text
        let actionText = "involved in";
        let amountDisplay = expense.amount;
        let colorClass = "text-muted-foreground";
        let Icon = Receipt;

        if (didIPay && !amISplit) {
          actionText = "you lent";
          amountDisplay = expense.amount; // You paid full
          colorClass = "text-green-600";
          Icon = ArrowUpRight;
        } else if (!didIPay && amISplit) {
          actionText = "you borrowed";
          amountDisplay = mySplitRecord.amount_owed;
          colorClass = "text-red-600";
          Icon = ArrowDownLeft;
        } else if (didIPay && amISplit) {
          // You paid for everyone, including yourself
          const lentAmount = (
            parseFloat(expense.amount) - parseFloat(mySplitRecord.amount_owed)
          ).toFixed(2);
          actionText = "you lent";
          amountDisplay = lentAmount;
          colorClass = "text-green-600";
          Icon = ArrowUpRight;
        }

        return (
          <div
            key={expense.id}
            className="flex items-center justify-between rounded-lg border bg-card p-4 shadow-sm transition-colors hover:bg-accent/50"
          >
            <div className="flex items-center gap-4">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full bg-secondary ${
                  colorClass === "text-green-600"
                    ? "bg-green-100 dark:bg-green-900/20"
                    : colorClass === "text-red-600"
                    ? "bg-red-100 dark:bg-red-900/20"
                    : ""
                }`}
              >
                <Icon className={`h-5 w-5 ${colorClass}`} />
              </div>
              <div>
                <p className="font-medium">{expense.description}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(expense.date).toLocaleDateString()} •{" "}
                  {expense.category}
                </p>
              </div>
            </div>

            <div className="text-right">
              <p className={`font-bold ${colorClass}`}>
                {colorClass === "text-green-600"
                  ? "+"
                  : colorClass === "text-red-600"
                  ? "-"
                  : ""}
                {formatCurrency(String(amountDisplay), expense.currency)}
              </p>
              <p className="text-xs text-muted-foreground">{actionText}</p>
            </div>
          </div>
        );
      })}

      <Button
        asChild
        variant="ghost"
        className="w-full text-xs text-muted-foreground"
      >
        <Link href="/expenses">View All History</Link>
      </Button>
    </div>
  );
}

