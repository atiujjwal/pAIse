"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
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
  Plus,
  UserMinus,
  AlertTriangle,
  ExternalLink,
  Ban,
} from "lucide-react";

import {
  useFriendDetails,
  useRemindFriend,
  useBlockUser,
} from "@/src/features/friends/api/friend-queries";
import { useSettlements } from "@/src/features/settlements/api/settlement-queries";
import { useAuthStore } from "@/src/features/auth/store";
import { api } from "@/src/lib/api";
import { useToastStore } from "@/src/hooks/use-toast";

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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/src/components/ui/Dialog";
import { SettlementModal } from "@/src/features/settlements/components/SettlementModal";
import { formatCurrency, cn } from "@/src/lib/utils";

// --- INTERFACES ---
interface PendingGroup {
  id: string;
  name: string;
  avatar: string | null;
  pending_balance: string;
  status: "owe" | "owed";
}

// --- LOCAL COMPONENTS ---

const PendingGroupsDialog = ({
  isOpen,
  onClose,
  groups,
  friendName,
  actionType = "remove",
}: {
  isOpen: boolean;
  onClose: () => void;
  groups: PendingGroup[];
  friendName: string;
  actionType?: "remove" | "block";
}) => {
  const router = useRouter();
  const actionLabel = actionType === "block" ? "Block" : "Remove";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-[2rem] p-8 bg-card border-border shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3 text-amber-600 mb-2">
            <div className="p-3 bg-amber-100 rounded-full">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <DialogTitle className="text-xl font-extrabold text-foreground">
              Cannot {actionLabel} Friend
            </DialogTitle>
          </div>
          <DialogDescription className="text-muted-foreground pt-2 text-base leading-relaxed">
            You have unsettled balances with <strong>{friendName}</strong> in
            the following groups. Please settle them before{" "}
            {actionLabel.toLowerCase()}ing this friend.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
          {groups.map((group) => (
            <div
              key={group.id}
              onClick={() => router.push(`/dashboard/groups/${group.id}`)}
              className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border cursor-pointer hover:bg-muted/50 hover:border-primary/20 transition-all group"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border border-background shadow-sm">
                  <AvatarImage src={group.avatar || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {group.name[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors">
                    {group.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    View Group <ExternalLink className="h-2.5 w-2.5" />
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span
                  className={cn(
                    "block font-mono font-bold text-sm",
                    group.status === "owe"
                      ? "text-destructive"
                      : "text-secondary"
                  )}
                >
                  {group.status === "owe" ? "You owe" : "Owes you"}
                </span>
                <span className="text-xs font-bold text-foreground">
                  {formatCurrency(group.pending_balance, "INR")}
                </span>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="mt-6">
          <Button
            onClick={onClose}
            className="w-full h-12 rounded-xl shadow-md"
          >
            Understood
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const SharedExpenseCard = ({ expense }: { expense: any }) => {
  const { user } = useAuthStore();
  const isGroup = !!expense.group;
  const avatarUrl = isGroup ? expense.group.avatar : expense.created_by.avatar;
  const name = isGroup ? expense.group.name : expense.created_by.name;

  const userPayment = expense.payers.find((p: any) => p.user.id === user?.id);
  const userSplit = expense.splits.find((s: any) => s.user.id === user?.id);

  const paidAmount = userPayment ? parseFloat(userPayment.amount) : 0;
  const shareAmount = userSplit ? parseFloat(userSplit.amount_owed) : 0;

  return (
    <Link
      href={`/dashboard/expenses/${expense.id}`}
      className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-card shadow-sm hover:border-primary/20 hover:shadow-md transition-all group"
    >
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

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
            {expense.description}
          </h4>
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

      <div className="text-right pl-2 flex flex-col items-end">
        <span className="block font-bold text-foreground font-mono text-base">
          {formatCurrency(expense.amount, expense.currency)}
        </span>

        <div className="flex flex-col items-end gap-0.5 mt-1">
          {paidAmount > 0 && (
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
              You paid {formatCurrency(String(paidAmount), expense.currency)}
            </span>
          )}

          {shareAmount > 0 && (
            <span className="text-[10px] font-medium text-muted-foreground">
              Your share:{" "}
              {formatCurrency(String(shareAmount), expense.currency)}
            </span>
          )}

          {paidAmount === 0 && shareAmount === 0 && (
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium bg-muted/50 px-2 py-0.5 rounded-md">
              {expense.split_type}
            </span>
          )}
        </div>
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
  const { addToast } = useToastStore();

  const { data: friend, isLoading: loadingFriend } = useFriendDetails(friendId);
  const { data: settlements, isLoading: loadingSettlements } = useSettlements({
    friend_id: friendId,
  });

  const { mutate: remindFriend, isPending: isReminding } = useRemindFriend();
  const { mutate: blockFriend, isPending: isBlocking } = useBlockUser();

  const [showSettlement, setShowSettlement] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [showBlockDialog, setShowBlockDialog] = useState(false); // New state
  const [showPendingGroupsDialog, setShowPendingGroupsDialog] = useState(false);
  const [pendingDialogType, setPendingDialogType] = useState<
    "remove" | "block"
  >("remove");
  const [pendingGroups, setPendingGroups] = useState<PendingGroup[]>([]);
  const [isReminded, setIsReminded] = useState(false);

  // --- MUTATION: REMOVE FRIEND ---
  const { mutate: removeFriend, isPending: isRemoving } = useMutation({
    mutationFn: async () => {
      await api.delete(`/friends/${friendId}`);
    },
    onSuccess: () => {
      addToast("Friend removed successfully", "success");
      router.push("/dashboard/friends");
    },
    onError: (err: any) => {
      const errorData = err?.response?.data;
      if (
        errorData?.code === "PENDING_GROUP_BALANCES" &&
        errorData?.data?.groups
      ) {
        setPendingGroups(errorData.data.groups);
        setPendingDialogType("remove");
        setShowRemoveDialog(false);
        setShowPendingGroupsDialog(true);
      } else {
        addToast(errorData?.message || "Failed to remove friend", "error");
      }
    },
  });

  // --- HANDLER: BLOCK FRIEND ---
  const handleBlockFriend = () => {
    blockFriend(friendId, {
      onSuccess: () => {
        addToast("User blocked successfully", "success");
        router.push("/dashboard/friends");
      },
      onError: (err: any) => {
        if (err?.response?.status === 403) {
          addToast(
            err?.response?.data?.message ||
              "Cannot block user due to outstanding debts.",
            "error"
          );
          setShowBlockDialog(false);
        } else {
          addToast("Failed to block user", "error");
        }
      },
    });
  };

  const isOwe = friend?.status === "owe";
  const isOwed = friend?.status === "owed";
  const isSettled = friend?.status === "settled";
  const balanceValue = friend?.net_balance || "0";

  const handleRemind = () => {
    if (isReminded || !friend) return;
    const formattedAmount = formatCurrency(balanceValue, friend.currency);
    remindFriend(
      {
        friendId,
        amount: formattedAmount,
        message: `Friendly reminder: You owe me ${formattedAmount}. Please settle up when you can!`,
      },
      { onSuccess: () => setIsReminded(true) }
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
          Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 max-w-7xl mx-auto">
      {/* --- HEADER SECTION --- */}
      <div className="bg-card rounded-[2.5rem] border border-border shadow-sm p-8 relative overflow-hidden">
        {/* ... (Header Visuals) ... */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20 z-0 pointer-events-none" />

        <div className="relative z-10">
          <div className="mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="text-muted-foreground hover:text-foreground -ml-2 hover:bg-muted rounded-xl"
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
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

              <div className="flex flex-wrap gap-3 w-full md:w-auto">
                {/* Block Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowBlockDialog(true)}
                  className="h-12 w-12 rounded-xl border border-border text-muted-foreground hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-all"
                  title="Block User"
                >
                  <Ban className="h-5 w-5" />
                </Button>

                {/* Remove Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowRemoveDialog(true)}
                  className="h-12 w-12 rounded-xl border border-border text-muted-foreground hover:text-orange-600 hover:bg-orange-50 hover:border-orange-200 transition-all"
                  title="Remove Friend"
                >
                  <UserMinus className="h-5 w-5" />
                </Button>

                <Button
                  asChild
                  className="flex-1 md:flex-none h-12 px-6 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
                >
                  <Link href={`/dashboard/expenses/new?friendId=${friend.id}`}>
                    <Plus className="mr-2 h-4 w-4" /> Add Expense
                  </Link>
                </Button>

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

      {/* --- TABS SECTION --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="direct" className="w-full">
            <TabsList className="bg-muted p-1.5 rounded-2xl w-full sm:w-auto h-14 mb-8">
              <TabsTrigger
                value="direct"
                className="rounded-xl h-full px-6 text-sm font-bold"
              >
                Direct
              </TabsTrigger>
              <TabsTrigger
                value="groups"
                className="rounded-xl h-full px-6 text-sm font-bold"
              >
                Groups
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="rounded-xl h-full px-6 text-sm font-bold"
              >
                History
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="direct"
              className="space-y-4 animate-in fade-in"
            >
              {friend.expenses.friend_expenses.length === 0 ? (
                <div className="py-16 text-center border-2 border-dashed border-border rounded-[2.5rem] bg-card">
                  <Receipt className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">No direct expenses.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {friend.expenses.friend_expenses.map((expense: any) => (
                    <SharedExpenseCard key={expense.id} expense={expense} />
                  ))}
                </div>
              )}
            </TabsContent>
            <TabsContent
              value="groups"
              className="space-y-4 animate-in fade-in"
            >
              {friend.expenses.group_expenses.length === 0 ? (
                <div className="py-16 text-center border-2 border-dashed border-border rounded-[2.5rem] bg-card">
                  <Layers className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">No group expenses.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {friend.expenses.group_expenses.map((expense: any) => (
                    <SharedExpenseCard key={expense.id} expense={expense} />
                  ))}
                </div>
              )}
            </TabsContent>
            <TabsContent
              value="history"
              className="space-y-4 animate-in fade-in"
            >
              {loadingSettlements ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-20 rounded-2xl" />
                  ))}
                </div>
              ) : settlements?.length === 0 ? (
                <div className="py-16 text-center border-2 border-dashed border-border rounded-[2.5rem] bg-card">
                  <ArrowRightLeft className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">No history.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {settlements.map((s: any) => {
                    const isPayer = s.payer.id === currentUser.id;
                    return (
                      <div
                        key={s.id}
                        className="flex items-center justify-between p-5 rounded-2xl border border-border bg-card shadow-sm"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={cn(
                              "h-12 w-12 rounded-full flex items-center justify-center text-xl",
                              isPayer
                                ? "bg-destructive/10 text-destructive"
                                : "bg-secondary/10 text-secondary"
                            )}
                          >
                            {isPayer ? "↑" : "↓"}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              {isPayer ? "You paid" : `${friend.name} paid`}
                              <span className="font-normal text-muted-foreground">
                                {" "}
                                to{" "}
                              </span>
                              {isPayer ? friend.name : "You"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(s.date).toLocaleDateString()}
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
                          {formatCurrency(s.amount, s.currency)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar Summary */}
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

      {/* REMOVE FRIEND DIALOG */}
      <Dialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <DialogContent className="sm:max-w-md rounded-3xl p-8 bg-card border-border">
          <DialogHeader>
            <div className="flex items-center gap-3 text-destructive mb-2">
              <div className="p-3 bg-destructive/10 rounded-full">
                <UserMinus className="h-6 w-6" />
              </div>
              <DialogTitle className="text-xl font-bold text-foreground">
                Remove Friend?
              </DialogTitle>
            </div>
            <DialogDescription className="text-muted-foreground pt-2 text-base leading-relaxed">
              Are you sure you want to remove <strong>{friend.name}</strong>?
              Your personal (non-group) balances will be cleared. Make sure all
              group balances are settled before continuing.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3 sm:gap-0 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowRemoveDialog(false)}
              className="rounded-xl h-12 border-border flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => removeFriend()}
              disabled={isRemoving}
              className="rounded-xl h-12 flex-1 shadow-lg shadow-destructive/20"
            >
              {isRemoving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Remove Friend"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* BLOCK FRIEND DIALOG */}
      <Dialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <DialogContent className="sm:max-w-md rounded-3xl p-8 bg-card border-border">
          <DialogHeader>
            <div className="flex items-center gap-3 text-red-600 mb-2">
              <div className="p-3 bg-red-100 rounded-full">
                <Ban className="h-6 w-6" />
              </div>
              <DialogTitle className="text-xl font-bold text-foreground">
                Block User?
              </DialogTitle>
            </div>
            <DialogDescription className="text-muted-foreground pt-2 text-base leading-relaxed">
              Are you sure you want to block <strong>{friend.name}</strong>?
              <br />
              <br />
              They will not be able to send you requests, see your profile, or
              expense details. Any zero-balance history will be removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3 sm:gap-0 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowBlockDialog(false)}
              className="rounded-xl h-12 border-border flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleBlockFriend}
              disabled={isBlocking}
              className="rounded-xl h-12 flex-1 shadow-lg shadow-red-500/20 bg-red-600 hover:bg-red-700"
            >
              {isBlocking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Block User"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PENDING GROUPS / CANNOT PROCEED DIALOG */}
      <PendingGroupsDialog
        isOpen={showPendingGroupsDialog}
        onClose={() => setShowPendingGroupsDialog(false)}
        groups={pendingGroups}
        friendName={friend.name}
        actionType={pendingDialogType}
      />
    </div>
  );
}
