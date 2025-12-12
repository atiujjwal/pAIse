"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Wallet,
  Receipt,
  ArrowRightLeft,
  Bell,
  CheckCircle2,
  Check,
  Loader2,
  TrendingUp,
  TrendingDown,
  Layers,
  CalendarDays,
} from "lucide-react";

import {
  useFriendDetails,
  useRemindFriend,
} from "@/src/features/friends/api/friend-queries";
import { useSettlements } from "@/src/features/settlements/api/settlement-queries";
import { useAuthStore } from "@/src/features/auth/store";

import { Button } from "@/src/components/ui/Button";
import { Skeleton } from "@/src/components/ui/Skeleton";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/src/components/ui/Avatar";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";
import { SettlementModal } from "@/src/features/settlements/components/SettlementModal";
import { formatCurrency, cn } from "@/src/lib/utils";

export default function FriendDetailsPage() {
  const params = useParams();
  const friendId = params?.id as string;
  const router = useRouter();
  const currentUser = useAuthStore((state) => state.user);

  // --- Queries ---
  // Using the new enriched API hook
  const { data: friend, isLoading: loadingFriend } = useFriendDetails(friendId);
  const { data: settlements, isLoading: loadingSettlements } = useSettlements({
    friend_id: friendId,
  });

  // --- Mutations ---
  const { mutate: remindFriend, isPending: isReminding } = useRemindFriend();

  // --- State ---
  const [showSettlement, setShowSettlement] = useState(false);
  const [isReminded, setIsReminded] = useState(false);

  // --- Derived State ---
  const isOwe = friend?.status === "owe";
  const isOwed = friend?.status === "owed";
  const isSettled = friend?.status === "settled";
  const balanceValue = friend?.net_balance || "0";

  // --- Handlers ---
  const handleRemind = () => {
    if (isReminded || !friend) return;

    const formattedAmount = formatCurrency(balanceValue, friend.currency);

    remindFriend(
      {
        friendId,
        amount: formattedAmount,
        message: `Friendly reminder: You owe me ${formattedAmount}. Please settle up when you can!`,
      },
      {
        onSuccess: () => setIsReminded(true),
      }
    );
  };

  if (loadingFriend) {
    return (
      <div className="space-y-6 animate-pulse p-6">
        <Skeleton className="h-10 w-32 rounded-lg" />
        <Skeleton className="h-64 w-full rounded-3xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-12 w-64 rounded-xl" />
            <Skeleton className="h-40 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!friend || !currentUser) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center">
        <h2 className="text-xl font-semibold text-slate-900">
          Friend not found
        </h2>
        <Button
          variant="link"
          onClick={() => router.push("/dashboard/friends")}
        >
          Back to Friends
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* --- HEADER SECTION --- */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8 relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-bl-full -mr-16 -mt-16 z-0" />

        <div className="relative z-10">
          {/* Back Button (In-flow for spacing) */}
          <div className="mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="text-slate-500 hover:text-slate-900 -ml-2 hover:bg-slate-100"
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to Friends
            </Button>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
            {/* Profile Info */}
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24 border-4 border-white shadow-md bg-white">
                <AvatarImage
                  src={friend.avatar || undefined}
                  className="object-cover"
                />
                <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-indigo-50 to-slate-100 text-slate-400">
                  {friend.name[0]}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-1">
                <h1 className="text-3xl font-extrabold text-slate-900">
                  {friend.name}
                </h1>
                <p className="text-slate-500 font-medium">{friend.email}</p>

                {/* Status Badge */}
                <div
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide mt-2",
                    isOwe
                      ? "bg-rose-100 text-rose-700"
                      : isOwed
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-600"
                  )}
                >
                  {isOwe && <TrendingDown className="h-3 w-3" />}
                  {isOwed && <TrendingUp className="h-3 w-3" />}
                  {isSettled && <CheckCircle2 className="h-3 w-3" />}
                  <span>
                    {isOwe ? "You Owe" : isOwed ? "Owes You" : "Settled"}
                  </span>
                </div>
              </div>
            </div>

            {/* Net Balance & Actions */}
            <div className="flex flex-col items-start md:items-end gap-4 w-full md:w-auto bg-slate-50/50 md:bg-transparent p-4 md:p-0 rounded-2xl md:rounded-none">
              <div className="text-left md:text-right">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Net Balance
                </p>
                <div
                  className={cn(
                    "text-4xl font-mono font-bold tracking-tight",
                    isOwe
                      ? "text-rose-600"
                      : isOwed
                      ? "text-emerald-600"
                      : "text-slate-400"
                  )}
                >
                  {formatCurrency(balanceValue, friend.currency)}
                </div>
              </div>

              <div className="flex gap-3 w-full md:w-auto">
                {isOwe && (
                  <Button
                    onClick={() => setShowSettlement(true)}
                    className="flex-1 md:flex-none bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-100"
                  >
                    <Wallet className="h-4 w-4 mr-2" /> Settle Up
                  </Button>
                )}

                {isOwed && (
                  <Button
                    onClick={handleRemind}
                    disabled={isReminding || isReminded}
                    className={cn(
                      "flex-1 md:flex-none shadow-lg transition-all",
                      isReminded
                        ? "bg-slate-100 text-slate-400 hover:bg-slate-100 shadow-none cursor-default"
                        : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-100"
                    )}
                  >
                    {isReminding ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : isReminded ? (
                      <Check className="h-4 w-4 mr-2" />
                    ) : (
                      <Bell className="h-4 w-4 mr-2" />
                    )}
                    {isReminded ? "Reminded" : "Remind"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- CONTENT TABS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Tabs defaultValue="direct" className="w-full">
            <TabsList className="bg-slate-100 p-1 rounded-xl w-full sm:w-auto h-12 mb-6">
              <TabsTrigger value="direct" className="rounded-lg h-10 px-6">
                Direct Expenses
              </TabsTrigger>
              <TabsTrigger value="groups" className="rounded-lg h-10 px-6">
                Group Expenses
              </TabsTrigger>
              <TabsTrigger value="history" className="rounded-lg h-10 px-6">
                Payment History
              </TabsTrigger>
            </TabsList>

            {/* 1. DIRECT EXPENSES */}
            <TabsContent value="direct" className="space-y-4">
              {friend.expenses.friend_expenses.length === 0 ? (
                <EmptyState
                  icon={Receipt}
                  message="No direct shared expenses yet."
                />
              ) : (
                <div className="space-y-3">
                  {friend.expenses.friend_expenses.map((expense) => (
                    <ExpenseItem key={expense.id} expense={expense} />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* 2. GROUP EXPENSES */}
            <TabsContent value="groups" className="space-y-4">
              {friend.expenses.group_expenses.length === 0 ? (
                <EmptyState
                  icon={Layers}
                  message="No shared expenses in groups."
                />
              ) : (
                <div className="space-y-3">
                  {friend.expenses.group_expenses.map((expense) => (
                    <GroupExpenseItem key={expense.id} expense={expense} />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* 3. SETTLEMENT HISTORY */}
            <TabsContent value="history" className="space-y-4">
              {loadingSettlements ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-20 w-full rounded-xl" />
                  ))}
                </div>
              ) : settlements?.length === 0 ? (
                <EmptyState
                  icon={ArrowRightLeft}
                  message="No payment history found."
                />
              ) : (
                <div className="space-y-3">
                  {settlements.map((s: any) => (
                    <SettlementItem
                      key={s.id}
                      settlement={s}
                      currentUserId={currentUser.id}
                      friendName={friend.name}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* --- RIGHT SIDEBAR (Stats / Info) --- */}
        <div className="lg:col-span-1">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sticky top-6">
            <h3 className="font-bold text-lg text-slate-800 mb-4">Summary</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                <span className="text-sm text-slate-500">Direct Shared</span>
                <span className="font-bold text-slate-900">
                  {friend.expenses.friend_expenses.length}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                <span className="text-sm text-slate-500">Group Shared</span>
                <span className="font-bold text-slate-900">
                  {friend.expenses.group_expenses.length}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                <span className="text-sm text-slate-500">
                  Total Transactions
                </span>
                <span className="font-bold text-slate-900">
                  {settlements?.length || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Settle Modal */}
      {showSettlement && isOwe && (
        <SettlementModal
          isOpen={showSettlement}
          onClose={() => setShowSettlement(false)}
          currentUser={{
            id: currentUser.id,
            name: currentUser.name,
            avatar: currentUser.avatar,
          }}
          counterparty={{
            id: friend.id,
            name: friend.name,
            avatar: friend.avatar,
          }}
          defaultAmount={balanceValue}
          context={{ type: "friend" }}
        />
      )}
    </div>
  );
}

// --- SUB-COMPONENTS ---

function ExpenseItem({ expense }: { expense: any }) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-white shadow-sm hover:border-primary/20 transition-all">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-lg bg-slate-100 flex flex-col items-center justify-center text-slate-500 border border-slate-200">
          <span className="text-[10px] font-bold uppercase">
            {new Date(expense.date).toLocaleString("default", {
              month: "short",
            })}
          </span>
          <span className="text-base font-bold text-slate-900">
            {new Date(expense.date).getDate()}
          </span>
        </div>
        <div>
          <p className="font-bold text-slate-900">{expense.description}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {expense.category}
            </span>
            <span className="text-xs text-slate-400">
              Paid by{" "}
              <span className="font-medium text-slate-600">
                {expense.created_by.name}
              </span>
            </span>
          </div>
        </div>
      </div>
      <span className="font-mono font-bold text-lg text-slate-900">
        {formatCurrency(expense.amount, "INR")}
      </span>
    </div>
  );
}

function GroupExpenseItem({ expense }: { expense: any }) {
  return (
    <div className="relative flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-white shadow-sm hover:border-primary/20 transition-all overflow-hidden">
      {/* Group Indicator Strip */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500" />

      <div className="flex items-center gap-4 pl-2">
        <div className="relative">
          <Avatar className="h-12 w-12 border border-slate-100 shadow-sm">
            <AvatarImage src={expense.group.avatar} />
            <AvatarFallback className="bg-indigo-50 text-indigo-600 font-bold">
              {expense.group.name[0]}
            </AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 border shadow-sm">
            <Layers className="h-3 w-3 text-slate-400" />
          </div>
        </div>

        <div>
          <p className="font-bold text-slate-900">{expense.description}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-xs font-medium text-indigo-600">
              {expense.group.name}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-400">
              Paid by {expense.created_by.name}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-end">
        <span className="font-mono font-bold text-lg text-slate-900">
          {formatCurrency(expense.amount, "INR")}
        </span>
        <span className="text-[10px] text-slate-400 uppercase font-medium">
          Group Expense
        </span>
      </div>
    </div>
  );
}

function SettlementItem({
  settlement,
  currentUserId,
  friendName,
}: {
  settlement: any;
  currentUserId: string;
  friendName: string;
}) {
  const isPayer = settlement.payer.id === currentUserId;
  return (
    <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-white shadow-sm">
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "h-10 w-10 rounded-full flex items-center justify-center text-lg",
            isPayer
              ? "bg-rose-100 text-rose-600"
              : "bg-emerald-100 text-emerald-600"
          )}
        >
          {isPayer ? "↑" : "↓"}
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">
            {isPayer ? "You paid" : `${friendName} paid`}
            <span className="font-normal text-slate-500"> to </span>
            {isPayer ? friendName : "You"}
          </p>
          <p className="text-xs text-slate-400">
            {new Date(settlement.date).toLocaleDateString(undefined, {
              dateStyle: "medium",
            })}
          </p>
        </div>
      </div>
      <span
        className={cn(
          "font-mono font-bold",
          isPayer ? "text-rose-600" : "text-emerald-600"
        )}
      >
        {isPayer ? "-" : "+"}
        {formatCurrency(settlement.amount, settlement.currency)}
      </span>
    </div>
  );
}

function EmptyState({ icon: Icon, message }: { icon: any; message: string }) {
  return (
    <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
      <Icon className="h-10 w-10 mx-auto mb-3 text-slate-300" />
      <p className="text-slate-500">{message}</p>
    </div>
  );
}
