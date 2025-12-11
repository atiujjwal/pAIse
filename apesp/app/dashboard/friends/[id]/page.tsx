"use client";

import { useMemo, useState } from "react";
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
} from "lucide-react";
import { Decimal } from "decimal.js";

import {
  useFriends,
  useRemindFriend,
} from "@/src/features/friends/api/friend-queries";
import { useExpenses } from "@/src/features/expenses/api/expense-queries";
import { useSettlements } from "@/src/features/settlements/api/settlement-queries";
import { useAuthStore } from "@/src/features/auth/store";

import { Button } from "@/src/components/ui/Button";
import { Skeleton } from "@/src/components/ui/Skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";
import { ExpenseList } from "@/src/features/expenses/components/ExpenseList";
import { SettlementModal } from "@/src/features/settlements/components/SettlementModal";
import { formatCurrency } from "@/src/lib/utils";

export default function FriendDetailsPage() {
  const params = useParams();
  const friendId = params?.id as string;
  const router = useRouter();
  const currentUser = useAuthStore((state) => state.user);

  // --- Data Fetching ---
  const { data: friendsList, isLoading: loadingFriend } = useFriends();
  const { data: expensesData } = useExpenses({ friend_id: friendId });
  const { data: settlementsData } = useSettlements({ friend_id: friendId });

  // --- Mutation ---
  const { mutate: remindFriend, isPending: isReminding } = useRemindFriend();

  const friend = friendsList?.find((f) => f.id === friendId);
  const [showSettlement, setShowSettlement] = useState(false);
  const [isReminded, setIsReminded] = useState(false);

  // --- Derived State ---
  const expenses = expensesData?.data || [];
  const settlements = settlementsData || [];

  const netBalance = useMemo(() => {
    if (!currentUser || !expenses || !settlements) return new Decimal(0);

    let balance = new Decimal(0);

    // 1. Calculate from Expenses
    expenses.forEach((exp) => {
      const myPayerEntry = exp.payers.find((p) => p.user.id === currentUser.id);
      const friendPayerEntry = exp.payers.find((p) => p.user.id === friendId);
      const mySplit = exp.splits.find((s) => s.user.id === currentUser.id);
      const friendSplit = exp.splits.find((s) => s.user.id === friendId);

      if (myPayerEntry) {
        if (friendSplit) balance = balance.add(friendSplit.amount_owed);
      } else if (friendPayerEntry) {
        if (mySplit) balance = balance.sub(mySplit.amount_owed);
      }
    });

    // 2. Calculate from Settlements
    settlements.forEach((s: any) => {
      if (s.payer.id === currentUser.id) {
        balance = balance.add(s.amount);
      } else if (s.receiver.id === currentUser.id) {
        balance = balance.sub(s.amount);
      }
    });

    return balance;
  }, [expenses, settlements, currentUser, friendId]);

  const balanceValue = parseFloat(netBalance.toFixed(2));
  const isOwed = balanceValue > 0;
  const isDebt = balanceValue < 0;
  const isSettled = balanceValue === 0;

  // --- HANDLERS ---
  const handleRemind = () => {
    if (isReminded) return;

    // FIXED: Pass the required 'amount' to the mutation
    const amountString = formatCurrency(
      Math.abs(balanceValue).toString(),
      "INR"
    );

    remindFriend(
      {
        friendId,
        amount: amountString,
        message: `Friendly reminder: You owe me ${amountString}. Please settle up when you can!`,
      },
      {
        onSuccess: () => {
          setIsReminded(true);
        },
      }
    );
  };

  if (loadingFriend)
    return (
      <div className="p-8">
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  if (!friend || !currentUser)
    return <div className="p-8 text-center">Friend not found</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Profile Header */}
      <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200 p-8 shadow-sm">
        <div className="absolute top-4 left-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="text-slate-400 hover:text-slate-700"
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-6 mt-6 md:mt-0">
          <div className="h-24 w-24 rounded-full bg-slate-100 flex items-center justify-center text-3xl font-bold text-slate-400 border-4 border-white shadow-sm">
            {friend.avatar ? (
              <img
                src={friend.avatar}
                alt={friend.name}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              friend.name[0]
            )}
          </div>

          <div className="flex-1 text-center md:text-left space-y-1">
            <h1 className="text-3xl font-bold text-slate-900">{friend.name}</h1>
            <p className="text-slate-500">{friend.email}</p>

            {!isSettled && (
              <p
                className={`font-medium ${
                  isOwed ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {isOwed ? "owes you" : "you owe"}{" "}
                {formatCurrency(Math.abs(balanceValue).toString(), "INR")}
              </p>
            )}
          </div>

          <div className="flex gap-3">
            {isDebt && (
              <Button
                onClick={() => setShowSettlement(true)}
                className="bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-100 text-white"
              >
                <Wallet className="h-4 w-4 mr-2" /> Settle Up
              </Button>
            )}

            {isOwed && (
              <Button
                onClick={handleRemind}
                disabled={isReminding || isReminded}
                className={`text-white shadow-lg transition-all ${
                  isReminded
                    ? "bg-slate-400 hover:bg-slate-400 cursor-default shadow-none"
                    : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100"
                }`}
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

            {isSettled && (
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100 text-slate-500">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <span className="text-sm font-medium">All Settled Up</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Tabs (Same as before) */}
      <Tabs defaultValue="expenses" className="w-full">
        <TabsList className="bg-slate-100 p-1 rounded-xl h-12 w-full md:w-auto">
          <TabsTrigger value="expenses" className="rounded-lg h-10 px-6">
            Shared Expenses
          </TabsTrigger>
          <TabsTrigger value="payments" className="rounded-lg h-10 px-6">
            Payment History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="expenses" className="mt-6">
          <div className="rounded-2xl border border-slate-200 bg-white min-h-[300px]">
            {expenses.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-60 text-slate-400">
                <Receipt className="h-10 w-10 mb-2 opacity-20" />
                <p>No shared expenses yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {expenses.map((expense) => (
                  <ExpenseList key={expense.id} expense={expense} />
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="payments" className="mt-6">
          <div className="rounded-2xl border border-slate-200 bg-white min-h-[300px]">
            {settlements.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-60 text-slate-400">
                <ArrowRightLeft className="h-10 w-10 mb-2 opacity-20" />
                <p>No payment history found.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {settlements.map((s: any) => {
                  const isPayer = s.payer.id === currentUser.id;
                  return (
                    <div
                      key={s.id}
                      className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`h-10 w-10 rounded-full flex items-center justify-center text-lg ${
                            isPayer
                              ? "bg-rose-100 text-rose-600"
                              : "bg-emerald-100 text-emerald-600"
                          }`}
                        >
                          {isPayer ? "↑" : "↓"}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">
                            {isPayer
                              ? `You paid ${friend.name}`
                              : `${friend.name} paid you`}
                          </p>
                          <p className="text-xs text-slate-500">
                            {new Date(s.date).toLocaleDateString(undefined, {
                              dateStyle: "medium",
                            })}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`font-bold font-mono ${
                          isPayer ? "text-rose-600" : "text-emerald-600"
                        }`}
                      >
                        {isPayer ? "-" : "+"}
                        {formatCurrency(s.amount, s.currency)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Settle Modal */}
      {showSettlement && isDebt && (
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
          defaultAmount={Math.abs(balanceValue).toString()}
          context={{ type: "friend" }}
        />
      )}
    </div>
  );
}
