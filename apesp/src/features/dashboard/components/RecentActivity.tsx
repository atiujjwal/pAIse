"use client";

import { Receipt, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "../../auth/store";
import { useRecentExpenses } from "@/src/features/dashboard/api/dashboard-queries";
import { Skeleton } from "@/src/components/ui/Skeleton";
import { formatCurrency } from "@/src/lib/utils";
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
      <div className="py-10 text-center text-slate-400">No recent activity</div>
    );

  return (
    <div className="space-y-4">
      {expenses.map((expense) => {
        const myPayerRecord = expense.payers.find(
          (p: any) => p.user.id === user?.id
        );
        const mySplitRecord = expense.splits.find(
          (s: any) => s.user.id === user?.id
        );
        const didIPay = !!myPayerRecord;
        const amISplit = !!mySplitRecord;

        let statusColor = "text-slate-500";
        let amountSign = "";
        let amount = expense.amount;
        let Icon = Receipt;
        let bgIcon = "bg-slate-100";

        if (didIPay && !amISplit) {
          statusColor = "text-emerald-600";
          amountSign = "+";
          Icon = ArrowUpRight;
          bgIcon = "bg-emerald-100";
        } else if (!didIPay && amISplit) {
          statusColor = "text-rose-500";
          amountSign = "-";
          amount = mySplitRecord.amount_owed;
          Icon = ArrowDownLeft;
          bgIcon = "bg-rose-100";
        } else if (didIPay && amISplit) {
          statusColor = "text-emerald-600";
          amountSign = "+";
          amount = (
            parseFloat(expense.amount) - parseFloat(mySplitRecord.amount_owed)
          ).toFixed(2);
          Icon = ArrowUpRight;
          bgIcon = "bg-emerald-100";
        }

        return (
          <div
            key={expense.id}
            className="group flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm transition-all hover:scale-[1.01] hover:shadow-md border border-slate-100"
          >
            <div className="flex items-center gap-4">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl ${bgIcon} transition-transform group-hover:rotate-6`}
              >
                <Icon className={`h-5 w-5 ${statusColor}`} />
              </div>
              <div>
                <p className="font-semibold text-slate-800">
                  {expense.description}
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span>
                    {new Date(expense.date).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <span className="h-1 w-1 rounded-full bg-slate-300" />
                  <span className="font-medium text-slate-500">
                    {expense.category}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className={`font-mono text-lg font-bold ${statusColor}`}>
                {amountSign}
                {formatCurrency(String(amount), expense.currency || "INR")}
              </p>
            </div>
          </div>
        );
      })}

      <Button
        asChild
        variant="ghost"
        className="w-full rounded-xl text-slate-500 hover:text-primary hover:bg-white"
      >
        <Link href="/dashboard/expenses">View Full History</Link>
      </Button>
    </div>
  );
}
