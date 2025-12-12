"use client";

import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Trash2,
  Calendar,
  Receipt,
  Layers,
  User,
  PieChart,
  Wallet,
  Loader2,
} from "lucide-react";
import { useAuthStore } from "@/src/features/auth/store";
import {
  useExpenseDetails,
  useDeleteExpense,
} from "@/src/features/expenses/api/expense-queries";
import { Skeleton } from "@/src/components/ui/Skeleton";
import { Button } from "@/src/components/ui/Button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/src/components/ui/Avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/src/components/ui/Dialog";
import { formatCurrency, cn } from "@/src/lib/utils";
import { useState } from "react";

// Helper to calculate percentages for visual bars
const calculatePercent = (part: string, total: string) => {
  const p = parseFloat(part);
  const t = parseFloat(total);
  if (t === 0) return 0;
  return Math.min(100, Math.round((p / t) * 100));
};

export default function ExpenseDetailsPage() {
  const { id: expenseId } = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // --- Data ---
  const { data: expense, isLoading } = useExpenseDetails(expenseId as string);
  const { mutate: deleteExpense, isPending: isDeleting } = useDeleteExpense();

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 pt-6">
        <Skeleton className="h-10 w-24 mb-4" />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  if (!expense) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <h2 className="text-xl font-bold text-slate-900">Expense Not Found</h2>
        <Button variant="link" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  // --- Logic ---
  const isCreator = expense.created_by.id === user?.id;
  const canDelete = isCreator;

  // 1. Strictly determine Context (Group vs Friend) using ID
  const isGroupExpense = !!expense?.group_id;

  // 2. Prepare Display Data based strictly on Context
  let mainAvatarUrl: string | null | undefined = null;
  let mainAvatarName: string | undefined = "";
  let MainFallbackIcon = User; // Default

  if (isGroupExpense) {
    // GROUP MODE
    mainAvatarUrl = expense.group?.avatar;
    mainAvatarName = expense.group?.name;
    MainFallbackIcon = Layers;
  } else {
    // FRIEND MODE
    mainAvatarUrl = expense.friend?.avatar;
    mainAvatarName = expense.friend?.name;
    MainFallbackIcon = User;
  }

  const handleDelete = () => {
    deleteExpense(expense.id as string);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* --- Navigation --- */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="text-slate-500 hover:text-slate-900 -ml-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>

        {canDelete && (
          <Button
            variant="ghost"
            className="text-rose-500 hover:text-rose-600 hover:bg-rose-50"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" /> Delete
          </Button>
        )}
      </div>

      {/* --- Main Card --- */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header Banner */}
        <div className="bg-slate-50/50 p-8 text-center border-b border-slate-100 relative">
          {/* Context Badge (Top Right) */}
          <div className="absolute top-4 right-4">
            {isGroupExpense ? (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-semibold text-slate-600 shadow-sm">
                <Layers className="h-3.5 w-3.5 text-indigo-500" />
                <span>{expense.group?.name || "Group Expense"}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-semibold text-slate-600 shadow-sm">
                <User className="h-3.5 w-3.5 text-emerald-500" />
                <span>Friend Expense</span>
              </div>
            )}
          </div>

          {/* Icon & Avatar Section */}
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center relative">
            {mainAvatarUrl ? (
              // Case A: Avatar Image Available (Group or Friend)
              <Avatar className="h-20 w-20 border-4 border-white shadow-sm">
                <AvatarImage src={mainAvatarUrl} className="object-cover" />
                <AvatarFallback className="bg-slate-200 text-slate-400 text-2xl font-bold">
                  {mainAvatarName?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ) : (
              // Case B: No Image -> Context Aware Icon (Group Icon OR Friend Icon)
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white border border-slate-100 shadow-sm text-primary">
                <MainFallbackIcon className="h-8 w-8 text-slate-700" />
              </div>
            )}
          </div>

          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {expense.description}
          </h1>

          <div className="mt-2 text-4xl font-mono font-bold text-slate-900">
            {formatCurrency(expense.amount, expense.currency)}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-sm text-slate-500">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {new Date(expense.date).toLocaleDateString(undefined, {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
            <div className="w-1 h-1 bg-slate-300 rounded-full" />
            <div className="capitalize font-medium text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-md">
              {expense.category}
            </div>
          </div>

          {/* Added By User (Creator) */}
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
            <span>Added by</span>
            <div className="flex items-center gap-2 rounded-full bg-white px-2 py-1 border border-slate-100 shadow-sm">
              <Avatar className="h-5 w-5">
                <AvatarImage src={expense.created_by.avatar || undefined} />
                <AvatarFallback className="text-[9px] bg-slate-100">
                  {expense.created_by.name[0]}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium text-slate-700">
                {expense.created_by.name}
              </span>
            </div>
          </div>
        </div>

        {/* Split Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          {/* PAYERS COLUMN */}
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="h-4 w-4 text-emerald-600" />
              <h3 className="font-bold text-sm uppercase tracking-wider text-slate-500">
                Paid By
              </h3>
            </div>

            <div className="space-y-4">
              {expense.payers.map((payer) => (
                <div
                  key={payer.id}
                  className="flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 border border-white shadow-sm">
                      <AvatarImage src={payer.user.avatar || undefined} />
                      <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs font-bold">
                        {payer.user.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-slate-700">
                      {payer.user.name}
                    </span>
                  </div>
                  <span className="font-bold text-emerald-600 font-mono">
                    {formatCurrency(payer.amount, expense.currency)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* SPLITS COLUMN */}
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <PieChart className="h-4 w-4 text-rose-500" />
              <h3 className="font-bold text-sm uppercase tracking-wider text-slate-500">
                Split With
              </h3>
            </div>

            <div className="space-y-5">
              {expense.splits.map((split) => {
                const percentage = calculatePercent(
                  split.amount_owed,
                  expense.amount
                );

                return (
                  <div key={split.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={split.user.avatar || undefined} />
                          <AvatarFallback className="text-[9px] bg-slate-100">
                            {split.user.name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-slate-700">
                          {split.user.name}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-slate-900 block font-mono leading-none">
                          {formatCurrency(split.amount_owed, expense.currency)}
                        </span>
                      </div>
                    </div>

                    {/* Visual Percentage Bar */}
                    <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-rose-400 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Receipt Section */}
      {expense.receipt_url && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
            <Receipt className="h-5 w-5 text-slate-400" />
            Receipt Image
          </h3>
          <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
            <img
              src={expense.receipt_url}
              alt="Expense Receipt"
              className="rounded-lg w-full h-auto max-h-[500px] object-contain mx-auto"
            />
          </div>
        </div>
      )}

      {/* --- DELETE CONFIRMATION DIALOG --- */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <Trash2 className="h-5 w-5" /> Delete Expense
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this expense? This will remove it
              from all balances and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Delete Forever"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
