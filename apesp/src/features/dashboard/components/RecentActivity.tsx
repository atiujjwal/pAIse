"use client";

import {
  Receipt,
  ArrowUpRight,
  ArrowDownLeft,
  Layers,
  User,
} from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "../../auth/store";
import { useRecentExpenses } from "@/src/features/dashboard/api/dashboard-queries";
import { Skeleton } from "@/src/components/ui/Skeleton";
import { formatCurrency, cn } from "@/src/lib/utils";
import { Button } from "@/src/components/ui/Button";

export function RecentActivity() {
  const { data: expenses, isLoading } = useRecentExpenses();
  const user = useAuthStore((state) => state.user);

  if (isLoading)
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
    );

  if (!expenses?.length)
    return (
      <div className="py-12 text-center border-2 border-dashed border-border rounded-3xl bg-muted/20">
        <p className="text-muted-foreground">No recent activity</p>
      </div>
    );

  return (
    <div className="space-y-3">
      {expenses.map((expense) => {
        const myPayerRecord = expense.payers.find(
          (p: any) => p.user.id === user?.id
        );
        const mySplitRecord = expense.splits.find(
          (s: any) => s.user.id === user?.id
        );
        const didIPay = !!myPayerRecord;
        const amISplit = !!mySplitRecord;
        const isGroup = !!expense.group;

        let statusColor = "text-muted-foreground";
        let amountSign = "";
        let amount = expense.amount;
        let Icon = Receipt;
        let bgIcon = "bg-muted";

        // Logic for icon and color
        if (didIPay && !amISplit) {
          statusColor = "text-secondary"; // Mint Green
          amountSign = "+";
          Icon = ArrowUpRight;
          bgIcon = "bg-secondary/10";
        } else if (!didIPay && amISplit) {
          statusColor = "text-destructive"; // Red
          amountSign = "-";
          amount = mySplitRecord.amount_owed;
          Icon = ArrowDownLeft;
          bgIcon = "bg-destructive/10";
        } else if (didIPay && amISplit) {
          statusColor = "text-secondary";
          amountSign = "+";
          amount = (
            parseFloat(expense.amount) - parseFloat(mySplitRecord.amount_owed)
          ).toFixed(2);
          Icon = ArrowUpRight;
          bgIcon = "bg-secondary/10";
        }

        return (
          <Link
            href={`/dashboard/expenses/${expense.id}`}
            key={expense.id}
            className="group flex items-center justify-between rounded-2xl bg-card p-4 shadow-sm border border-border hover:border-primary/20 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-xl transition-transform group-hover:scale-110",
                  bgIcon
                )}
              >
                <Icon className={cn("h-5 w-5", statusColor)} />
              </div>

              <div className="flex flex-col">
                <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  {expense.description}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  <span>
                    {new Date(expense.date).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <span className="h-1 w-1 rounded-full bg-border" />
                  <div className="flex items-center gap-1">
                    {isGroup ? (
                      <Layers className="h-3 w-3" />
                    ) : (
                      <User className="h-3 w-3" />
                    )}
                    <span className="max-w-[100px] truncate">
                      {isGroup ? expense.group.name : expense.category}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-right">
              <p className={cn("font-mono text-lg font-bold", statusColor)}>
                {amountSign}
                {formatCurrency(String(amount), expense.currency || "INR")}
              </p>
            </div>
          </Link>
        );
      })}

      <Button
        asChild
        variant="ghost"
        className="w-full rounded-xl text-muted-foreground hover:text-primary hover:bg-muted/50 mt-2"
      >
        <Link href="/dashboard/expenses">View Full History</Link>
      </Button>
    </div>
  );
}
