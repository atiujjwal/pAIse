import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import ExpenseForm from "@/src/components/forms/expense/ExpenseForm";

export default function NewExpensePage() {
  return (
    <div className="max-w-2xl mx-auto pb-20 pt-6">
      {/* Back Button */}
      <div className="mb-4">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl pl-2"
        >
          <Link href="/dashboard/expenses">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Expenses
          </Link>
        </Button>
      </div>

      {/* Header */}
      <div className="mb-10 px-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          Add New Expense
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Record a transaction with friends or groups.
        </p>
      </div>

      {/* Form */}
      <ExpenseForm />
    </div>
  );
}
