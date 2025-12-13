"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
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
  Calendar,
  User,
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

// --- LOCAL COMPONENT: Consistent Expense Card ---
const SharedExpenseCard = ({ expense }: { expense: any }) => {
  const isGroup = !!expense.group;
  // Logic:
  // - Group Expense: Show Group Avatar + Name
  // - Direct Expense: Show Creator Avatar + Name (Who added it)
  const avatarUrl = isGroup ? expense.group.avatar : expense.created_by.avatar;
  const name = isGroup ? expense.group.name : expense.created_by.name;

  return (
    <Link
      href={`/dashboard/expenses/${expense.id}`}
      className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-card shadow-sm hover:border-primary/20 hover:shadow-md transition-all group"
    >
      {/* Avatar Section */}
      <Avatar className="h-12 w-12 border border-border shadow-sm group-hover:border-primary/30 transition-colors">
        <AvatarImage src={avatarUrl || undefined} className="object-cover" />
        <AvatarFallback
          className={cn(
            "text-xs font-bold",
            isGroup
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground"
          )}
        >
          {name?.[0]?.toUpperCase()}
        </AvatarFallback>
      </Avatar>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
            {expense.description}
          </h4>
          {/* Badge for Context */}
          {isGroup && (
            <span className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold bg-primary/10 text-primary uppercase tracking-wider">
              Group
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>
              {new Date(expense.date).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
          <span className="text-border">•</span>
          <span className="capitalize">{expense.category}</span>
          <span className="text-border">•</span>
          <span className="truncate max-w-[100px]">
            {isGroup
              ? "Group Expense"
              : `Added by ${expense.created_by.name.split(" ")[0]}`}
          </span>
        </div>
      </div>

      {/* Amount Section */}
      <div className="text-right">
        <span className="block font-bold text-foreground font-mono text-base">
          {formatCurrency(expense.amount, expense.currency)}
        </span>
        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide bg-muted/50 px-2 py-0.5 rounded-md mt-1 inline-block">
          {expense.split_type}
        </span>
      </div>
    </Link>
  );
};

// --- MAIN PAGE ---

export default function FriendDetailsPage() {
  const params = useParams();
  const friendId = params?.id as string;
  const router = useRouter();
  const currentUser = useAuthStore((state) => state.user);

  // --- Queries ---
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
      <div className="space-y-6 animate-pulse p-4 max-w-7xl mx-auto">
        <Skeleton className="h-10 w-32 rounded-lg" />
        <Skeleton className="h-64 w-full rounded-3xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-14 w-full rounded-2xl" />
            <Skeleton className="h-40 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!friend || !currentUser) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-4">
        <div className="p-6 bg-muted/30 rounded-full">
          <User className="h-12 w-12 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Friend not found</h2>
        <Button
          variant="outline"
          onClick={() => router.push("/dashboard/friends")}
          className="rounded-xl"
        >
          Back to Friends
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 max-w-7xl mx-auto">
      {/* --- HEADER SECTION --- */}
      <div className="bg-card rounded-[2.5rem] border border-border shadow-sm p-8 relative overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20 z-0 pointer-events-none" />

        <div className="relative z-10">
          {/* Back Button */}
          <div className="mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="text-muted-foreground hover:text-foreground -ml-2 hover:bg-muted rounded-xl"
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to Friends
            </Button>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
            {/* Profile Info */}
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                <AvatarImage
                  src={friend.avatar || undefined}
                  className="object-cover"
                />
                <AvatarFallback className="text-3xl font-bold bg-primary/10 text-primary">
                  {friend.name[0]}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-1">
                <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
                  {friend.name}
                </h1>
                <p className="text-muted-foreground font-medium">
                  {friend.email}
                </p>

                {/* Status Badge */}
                <div
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide mt-2 shadow-sm border",
                    isOwe
                      ? "bg-destructive/10 text-destructive border-destructive/20"
                      : isOwed
                      ? "bg-secondary/10 text-secondary border-secondary/20"
                      : "bg-muted text-muted-foreground border-border"
                  )}
                >
                  {isOwe && <TrendingDown className="h-3.5 w-3.5" />}
                  {isOwed && <TrendingUp className="h-3.5 w-3.5" />}
                  {isSettled && <CheckCircle2 className="h-3.5 w-3.5" />}
                  <span>
                    {isOwe ? "You Owe" : isOwed ? "Owes You" : "Settled"}
                  </span>
                </div>
              </div>
            </div>

            {/* Net Balance & Actions */}
            <div className="flex flex-col items-start md:items-end gap-6 w-full md:w-auto bg-muted/20 md:bg-transparent p-6 md:p-0 rounded-3xl md:rounded-none border border-border md:border-none">
              <div className="text-left md:text-right">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  Net Balance
                </p>
                <div
                  className={cn(
                    "text-5xl font-mono font-bold tracking-tighter",
                    isOwe
                      ? "text-destructive"
                      : isOwed
                      ? "text-secondary"
                      : "text-muted-foreground"
                  )}
                >
                  {formatCurrency(balanceValue, friend.currency)}
                </div>
              </div>

              <div className="flex gap-3 w-full md:w-auto">
                {isOwe && (
                  <Button
                    onClick={() => setShowSettlement(true)}
                    className="flex-1 md:flex-none h-12 px-6 rounded-xl bg-destructive hover:bg-destructive/90 text-white shadow-lg shadow-destructive/20"
                  >
                    <Wallet className="h-4 w-4 mr-2" /> Settle Up
                  </Button>
                )}

                {isOwed && (
                  <Button
                    onClick={handleRemind}
                    disabled={isReminding || isReminded}
                    className={cn(
                      "flex-1 md:flex-none h-12 px-6 rounded-xl shadow-lg transition-all",
                      isReminded
                        ? "bg-muted text-muted-foreground hover:bg-muted shadow-none cursor-default"
                        : "bg-secondary hover:bg-secondary/90 text-secondary-foreground shadow-secondary/20"
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
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="direct" className="w-full">
            <TabsList className="bg-muted p-1.5 rounded-2xl w-full sm:w-auto h-14 mb-8">
              <TabsTrigger
                value="direct"
                className="rounded-xl h-full px-6 text-sm font-bold"
              >
                Direct Expenses
              </TabsTrigger>
              <TabsTrigger
                value="groups"
                className="rounded-xl h-full px-6 text-sm font-bold"
              >
                Group Expenses
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="rounded-xl h-full px-6 text-sm font-bold"
              >
                Payment History
              </TabsTrigger>
            </TabsList>

            {/* 1. DIRECT EXPENSES */}
            <TabsContent
              value="direct"
              className="space-y-4 animate-in fade-in slide-in-from-bottom-2"
            >
              {friend.expenses.friend_expenses.length === 0 ? (
                <EmptyState
                  icon={Receipt}
                  message="No direct shared expenses yet."
                />
              ) : (
                <div className="space-y-3">
                  {friend.expenses.friend_expenses.map((expense: any) => (
                    <SharedExpenseCard key={expense.id} expense={expense} />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* 2. GROUP EXPENSES */}
            <TabsContent
              value="groups"
              className="space-y-4 animate-in fade-in slide-in-from-bottom-2"
            >
              {friend.expenses.group_expenses.length === 0 ? (
                <EmptyState
                  icon={Layers}
                  message="No shared expenses in groups."
                />
              ) : (
                <div className="space-y-3">
                  {friend.expenses.group_expenses.map((expense: any) => (
                    <SharedExpenseCard key={expense.id} expense={expense} />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* 3. SETTLEMENT HISTORY */}
            <TabsContent
              value="history"
              className="space-y-4 animate-in fade-in slide-in-from-bottom-2"
            >
              {loadingSettlements ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-20 w-full rounded-2xl" />
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
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm sticky top-6">
            <h3 className="font-bold text-lg text-foreground mb-6">Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-4 bg-muted/30 rounded-2xl border border-border">
                <span className="text-sm font-medium text-muted-foreground">
                  Direct Shared
                </span>
                <span className="font-bold text-foreground text-lg">
                  {friend.expenses.friend_expenses.length}
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-muted/30 rounded-2xl border border-border">
                <span className="text-sm font-medium text-muted-foreground">
                  Group Shared
                </span>
                <span className="font-bold text-foreground text-lg">
                  {friend.expenses.group_expenses.length}
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-muted/30 rounded-2xl border border-border">
                <span className="text-sm font-medium text-muted-foreground">
                  Total Transactions
                </span>
                <span className="font-bold text-foreground text-lg">
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
    <div className="flex items-center justify-between p-5 rounded-2xl border border-border bg-card shadow-sm hover:border-primary/20 transition-all">
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "h-12 w-12 rounded-full flex items-center justify-center text-xl shadow-sm",
            isPayer
              ? "bg-destructive/10 text-destructive"
              : "bg-secondary/10 text-secondary"
          )}
        >
          {isPayer ? "↑" : "↓"}
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">
            {isPayer ? "You paid" : `${friendName} paid`}
            <span className="font-normal text-muted-foreground"> to </span>
            {isPayer ? friendName : "You"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {new Date(settlement.date).toLocaleDateString(undefined, {
              dateStyle: "medium",
            })}
          </p>
        </div>
      </div>
      <span
        className={cn(
          "font-mono font-bold text-lg",
          isPayer ? "text-destructive" : "text-secondary"
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
    <div className="py-16 text-center border-2 border-dashed border-border rounded-[2.5rem] bg-muted/10">
      <Icon className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
      <p className="text-muted-foreground font-medium">{message}</p>
    </div>
  );
}
