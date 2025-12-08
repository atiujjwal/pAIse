"use client";

import { format } from "date-fns";
import { ArrowRight, Calendar, Layers, User } from "lucide-react";
import { formatCurrency } from "@/src/lib/utils";

interface ExpenseListProps {
  expense: any; // Using 'any' temporarily to match your API response structure, or define interface below
}

export function ExpenseList({ expense }: ExpenseListProps) {
  const isGroupExpense = !!expense.group;

  // Helper to get initials
  const getInitials = (name: string) =>
    name?.substring(0, 2).toUpperCase() || "??";

  return (
    <div className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group">
      <div className="flex items-center gap-4">
        {/* Date Box */}
        <div className="flex flex-col items-center justify-center h-12 w-12 rounded-xl bg-slate-100 text-slate-600 border border-slate-200">
          <span className="text-xs font-bold uppercase">
            {format(new Date(expense.date), "MMM")}
          </span>
          <span className="text-sm font-bold">
            {format(new Date(expense.date), "dd")}
          </span>
        </div>

        {/* Details */}
        <div className="flex flex-col">
          <p className="font-semibold text-slate-900 group-hover:text-primary transition-colors">
            {expense.description}
          </p>

          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
            <span className="inline-flex items-center gap-1">
              {isGroupExpense ? (
                <Layers className="h-3 w-3" />
              ) : (
                <User className="h-3 w-3" />
              )}
              {isGroupExpense ? expense.group?.name : "Friend"}
            </span>
            <span>•</span>
            <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
              {expense.category}
            </span>
            <span>•</span>
            <span>
              Paid by{" "}
              <strong>{expense.payers[0]?.user.name.split(" ")[0]}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Amount & Actions */}
      <div className="text-right">
        <p className="font-bold font-mono text-slate-900 text-lg">
          {formatCurrency(expense.amount, expense.currency)}
        </p>
        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
          {expense.split_type}
        </p>
      </div>
    </div>
  );
}
