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
  Pencil,
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
        <Skeleton className="h-10 w-24 mb-4 rounded-lg" />
        <Skeleton className="h-64 w-full rounded-[2.5rem]" />
        <Skeleton className="h-40 w-full rounded-[2.5rem]" />
      </div>
    );
  }

  if (!expense) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="p-6 bg-muted/20 rounded-full">
          <Receipt className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Expense Not Found</h2>
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="rounded-xl"
        >
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
          className="text-muted-foreground hover:text-foreground -ml-2 rounded-xl"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>

        {isCreator && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="rounded-xl h-10 border-border bg-card hover:bg-muted text-foreground"
              onClick={() =>
                router.push(`/dashboard/expenses/${expenseId}/edit`)
              }
            >
              <Pencil className="h-4 w-4 mr-2" /> Edit
            </Button>
            <Button
              variant="ghost"
              className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl h-10"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* --- Main Card --- */}
      <div className="bg-card rounded-[2.5rem] border border-border shadow-sm overflow-hidden">
        {/* Header Banner */}
        <div className="bg-muted/30 p-8 text-center border-b border-border relative">
          {/* Context Badge (Top Right) */}
          <div className="absolute top-6 right-6">
            <div
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm border",
                isGroupExpense
                  ? "bg-primary/10 text-primary border-primary/20"
                  : "bg-secondary/10 text-secondary border-secondary/20"
              )}
            >
              {isGroupExpense ? (
                <Layers className="h-3 w-3" />
              ) : (
                <User className="h-3 w-3" />
              )}
              <span>{isGroupExpense ? "Group" : "Friend"}</span>
            </div>
          </div>

          {/* Icon & Avatar Section */}
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center relative">
            <div className="relative h-full w-full">
              {mainAvatarUrl ? (
                <Avatar className="h-24 w-24 border-4 border-card shadow-lg">
                  <AvatarImage src={mainAvatarUrl} className="object-cover" />
                  <AvatarFallback className="bg-primary/10 text-primary text-3xl font-bold">
                    {mainAvatarName?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-card border-2 border-border shadow-sm text-muted-foreground">
                  <MainFallbackIcon className="h-10 w-10" />
                </div>
              )}
            </div>
          </div>

          <h1 className="text-2xl font-extrabold text-foreground tracking-tight mb-2">
            {expense.description}
          </h1>

          <div className="text-5xl font-mono font-bold text-foreground tracking-tighter">
            {formatCurrency(expense.amount, expense.currency)}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-background rounded-full border border-border shadow-sm">
              <Calendar className="h-4 w-4" />
              <span className="font-medium">
                {new Date(expense.date).toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>

            <div className="capitalize font-medium text-foreground bg-background px-3 py-1 rounded-full border border-border shadow-sm">
              {expense.category}
            </div>
          </div>

          {/* Added By User (Creator) */}
          <div className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <span>Added by</span>
            <div className="flex items-center gap-2 rounded-full bg-background pr-3 pl-1 py-1 border border-border shadow-sm">
              <Avatar className="h-6 w-6">
                <AvatarImage src={expense.created_by.avatar || undefined} />
                <AvatarFallback className="text-[9px] bg-muted">
                  {expense.created_by.name[0]}
                </AvatarFallback>
              </Avatar>
              <span className="font-semibold text-foreground">
                {expense.created_by.name}
              </span>
            </div>
          </div>
        </div>

        {/* Split Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
          {/* PAYERS COLUMN */}
          <div className="p-8 space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
                <Wallet className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">
                Paid By
              </h3>
            </div>

            <div className="space-y-4">
              {expense.payers.map((payer) => (
                <div
                  key={payer.id}
                  className="flex items-center justify-between group p-2 rounded-xl hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border border-border shadow-sm">
                      <AvatarImage src={payer.user.avatar || undefined} />
                      <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs font-bold dark:bg-emerald-900 dark:text-emerald-300">
                        {payer.user.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-semibold text-foreground">
                      {payer.user.name}
                    </span>
                  </div>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    {formatCurrency(payer.amount, expense.currency)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* SPLITS COLUMN */}
          <div className="p-8 space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-rose-500/10 rounded-lg text-rose-500">
                <PieChart className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">
                Split With
              </h3>
            </div>

            <div className="space-y-6">
              {expense.splits.map((split) => {
                const percentage = calculatePercent(
                  split.amount_owed,
                  expense.amount
                );

                return (
                  <div key={split.id} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={split.user.avatar || undefined} />
                          <AvatarFallback className="text-[9px] bg-muted font-bold">
                            {split.user.name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-foreground">
                          {split.user.name}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-foreground block font-mono leading-none">
                          {formatCurrency(split.amount_owed, expense.currency)}
                        </span>
                      </div>
                    </div>

                    {/* Visual Percentage Bar */}
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
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
        <div className="rounded-[2.5rem] border border-border bg-card p-8 shadow-sm">
          <h3 className="font-bold text-lg text-foreground mb-6 flex items-center gap-2">
            <div className="p-2 bg-muted rounded-lg">
              <Receipt className="h-5 w-5 text-muted-foreground" />
            </div>
            Receipt Image
          </h3>
          <div className="bg-muted/30 rounded-3xl p-4 border border-border">
            <img
              src={expense.receipt_url}
              alt="Expense Receipt"
              className="rounded-2xl w-full h-auto max-h-[500px] object-contain mx-auto"
            />
          </div>
        </div>
      )}

      {/* --- DELETE CONFIRMATION DIALOG --- */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6 bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2 text-xl">
              <div className="p-2 bg-destructive/10 rounded-full">
                <Trash2 className="h-5 w-5" />
              </div>
              Delete Expense
            </DialogTitle>
            <DialogDescription className="text-muted-foreground pt-2">
              Are you sure you want to delete this expense? This will remove it
              from all balances and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3 sm:gap-0 mt-4">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="rounded-xl h-11 border-border"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded-xl h-11 shadow-md shadow-destructive/20"
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
