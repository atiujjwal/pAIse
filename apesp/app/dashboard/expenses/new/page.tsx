"use client";
import ExpenseForm from "../../../../src/components/forms/ExpenseForm";

export default function NewExpensePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-mono-900">Add New Expense</h1>
        <p className="text-mono-600">Record a transaction</p>
      </div>
      <ExpenseForm />
    </div>
  );
}