"use client";

import ExpenseForm from "@/src/components/forms/expense/ExpenseForm";

export default function CreateExpensePage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Add New Expense
        </h1>
        <p className="text-slate-500">
          Record a transaction with friends or groups.
        </p>
      </div>
      <ExpenseForm />
    </div>
  );
}
