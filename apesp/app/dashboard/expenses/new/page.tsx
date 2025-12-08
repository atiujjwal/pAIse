import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import ExpenseForm from "@/src/components/forms/expense/ExpenseForm";

export default function NewExpensePage() {
  return (
    <div className="max-w-2xl mx-auto pb-20 pt-6">
      {/* Back Button */}
      <div className="mb-2">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="text-slate-500 hover:text-slate-900 hover:bg-slate-100/50 -ml-3"
        >
          <Link href="/dashboard/expenses">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Expenses
          </Link>
        </Button>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
          Add New Expense
        </h1>
        <p className="text-slate-500 mt-2 text-lg">
          Record a transaction with friends or groups.
        </p>
      </div>

      {/* Form */}
      <ExpenseForm />
    </div>
  );
}
