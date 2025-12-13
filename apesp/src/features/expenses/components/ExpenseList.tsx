"use client";

import { format } from "date-fns";
import { Layers, User } from "lucide-react";
import { formatCurrency, cn } from "@/src/lib/utils";

interface ExpenseListProps {
  expense: any;
}

export function ExpenseList({ expense }: ExpenseListProps) {
  const isGroupExpense = !!expense.group;

  return (
    <div className="flex items-center justify-between p-5 bg-card hover:bg-muted/30 transition-colors group border-b border-border last:border-0 last:rounded-b-3xl first:rounded-t-3xl">
      <div className="flex items-center gap-5">
        {/* Date Box */}
        <div className="flex flex-col items-center justify-center h-14 w-14 rounded-2xl bg-muted/30 text-muted-foreground border border-border group-hover:border-primary/20 group-hover:bg-primary/5 transition-all">
          <span className="text-[10px] font-bold uppercase tracking-wider">
            {format(new Date(expense.date), "MMM")}
          </span>
          <span className="text-lg font-bold text-foreground">
            {format(new Date(expense.date), "dd")}
          </span>
        </div>

        {/* Details */}
        <div className="flex flex-col gap-1">
          <p className="font-semibold text-foreground text-base group-hover:text-primary transition-colors">
            {expense.description}
          </p>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span
              className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium border",
                isGroupExpense
                  ? "bg-primary/5 text-primary border-primary/10"
                  : "bg-secondary/5 text-secondary border-secondary/10"
              )}
            >
              {isGroupExpense ? (
                <Layers className="h-3 w-3" />
              ) : (
                <User className="h-3 w-3" />
              )}
              {isGroupExpense ? expense.group?.name : "Friend"}
            </span>
            <span className="text-border">•</span>
            <span>{expense.category}</span>
            <span className="text-border">•</span>
            <span>
              Paid by{" "}
              <strong className="text-foreground">
                {expense.payers[0]?.user.name.split(" ")[0]}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* Amount & Actions */}
      <div className="text-right">
        <p className="font-mono font-bold text-foreground text-lg">
          {formatCurrency(expense.amount, expense.currency)}
        </p>
        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider bg-muted/50 px-2 py-0.5 rounded-md inline-block mt-1">
          {expense.split_type}
        </p>
      </div>
    </div>
  );
}
