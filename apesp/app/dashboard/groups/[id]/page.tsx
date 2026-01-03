"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Settings,
  Users,
  ArrowRightLeft,
  UserPlus,
  MoreVertical,
  Shield,
  UserMinus,
  ArrowLeft,
  Receipt,
  Calendar,
  Layers,
  User,
  Plus,
} from "lucide-react";

import { useAuthStore } from "@/src/features/auth/store";
import {
  useGroupDetails,
  useGroupBalances,
  useGroupExpenses,
  useSimplifyDebts,
  useRemoveMember,
  useUpdateMemberRole,
  OptimizedPayment,
} from "@/src/features/groups/api/group-details-query";
import { useSettlements } from "@/src/features/settlements/api/settlement-queries";

import { SimplifyDebtDialog } from "@/src/features/groups/components/SimplifyDebtDialog";
import { AddMemberDialog } from "@/src/features/groups/components/AddMemberDialog";
import { EditGroupDialog } from "@/src/features/groups/components/EditGroupDialog";
import { SettlementModal } from "@/src/features/settlements/components/SettlementModal";
import { BalancesList } from "@/src/features/groups/components/BalancesList";

import { Skeleton } from "@/src/components/ui/Skeleton";
import { Button } from "@/src/components/ui/Button";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/Dropdown-menu";
import { formatCurrency, cn } from "@/src/lib/utils";

// --- LOCAL COMPONENT: Consistent Expense Card for Group View ---
const GroupExpenseCard = ({ expense }: { expense: any }) => {
  const { user } = useAuthStore();
  const avatarUrl = expense.created_by.avatar;
  const displayName = expense.created_by.name;

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
        <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
          {displayName?.[0]?.toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
            {expense.description}
          </h4>
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
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <span className="truncate max-w-[100px]">
              {displayName.split(" ")[0]}
            </span>
          </div>
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

export default function GroupDetailsPage() {
  const params = useParams();
  const groupId = params?.id as string;
  const { user } = useAuthStore((state) => state);
  const router = useRouter();

  const { data: group, isLoading: loadingGroup } = useGroupDetails(groupId);
  const { data: balances } = useGroupBalances(groupId);
  const { data: expensesResponse, isLoading: loadingExpenses } =
    useGroupExpenses(groupId);
  const { data: settlements, isLoading: loadingSettlements } = useSettlements({
    group_id: groupId,
  });

  const expensesList = Array.isArray(expensesResponse) ? expensesResponse : [];

  const { mutate: removeMember } = useRemoveMember(groupId);
  const { mutate: updateRole } = useUpdateMemberRole(groupId);
  const { mutate: simplify, isPending: isSimplifying } =
    useSimplifyDebts(groupId);

  const [showSimplifyModal, setShowSimplifyModal] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showEditGroup, setShowEditGroup] = useState(false);
  const [settlementTarget, setSettlementTarget] = useState<{
    id: string;
    name: string;
    amount: string;
    avatar?: string | null;
  } | null>(null);
  const [optimizedData, setOptimizedData] = useState<OptimizedPayment[]>([]);

  const userAvatar = useMemo(() => {
    if (user?.avatar) return user.avatar;
    return null;
  }, [user]);

  const handleSimplify = () => {
    setShowSimplifyModal(true);
    simplify(undefined, { onSuccess: (data) => setOptimizedData(data) });
  };

  if (loadingGroup) return <LoadingSkeleton />;
  if (!group) return <GroupNotFound />;

  const isAdmin =
    group.members.find((m) => m.user.id === user?.id)?.role === "ADMIN";
  const netBalance = parseFloat(balances?.net_balance || "0");

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 max-w-7xl mx-auto">
      {/* HEADER SECTION */}
      <div className="bg-card rounded-[2.5rem] border border-border shadow-sm p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20 z-0 pointer-events-none" />

        <div className="relative z-10">
          <div className="mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard/groups")}
              className="text-muted-foreground hover:text-foreground -ml-2 hover:bg-muted rounded-xl"
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24 rounded-3xl border-4 border-background shadow-xl">
                <AvatarImage
                  src={group.avatar || undefined}
                  className="object-cover"
                />
                <AvatarFallback className="rounded-3xl text-4xl font-bold bg-primary/10 text-primary">
                  {group.name[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-1">
                <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                  {group.name}
                </h1>
                <p className="text-muted-foreground font-medium text-lg max-w-xl line-clamp-1">
                  {group.description || "No description"}
                </p>

                <div className="flex items-center gap-2 pt-2">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/50 border border-border text-xs font-bold text-muted-foreground uppercase tracking-wide">
                    <Users className="h-3.5 w-3.5" />
                    <span>{group.members.length} Members</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 w-full md:w-auto">
              <Button
                variant="outline"
                onClick={handleSimplify}
                className="flex-1 md:flex-none h-12 rounded-xl border-border hover:bg-muted"
              >
                <ArrowRightLeft className="mr-2 h-4 w-4" /> Simplify
              </Button>
              <Button
                asChild
                className="flex-1 md:flex-none h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
              >
                <Link href={`/dashboard/expenses/new?groupId=${groupId}`}>
                  <Plus className="mr-2 h-4 w-4" /> Add Expense
                </Link>
              </Button>
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowEditGroup(true)}
                  className="h-12 w-12 rounded-xl border border-border hover:bg-muted"
                >
                  <Settings className="h-5 w-5 text-muted-foreground" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* --- LEFT COLUMN: TABS --- */}
        <div className="lg:col-span-2 space-y-6">
          {/* NET BALANCE CARD */}
          <div className="p-8 rounded-[2rem] bg-gradient-to-br from-gray-900 to-slate-800 dark:from-background dark:to-card dark:border dark:border-border text-white shadow-xl flex items-center justify-between relative overflow-hidden">
            <div className="absolute inset-0 bg-white/5 opacity-50 pattern-grid-lg" />
            <div className="relative z-10">
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">
                Your Net Balance
              </p>
              <div
                className={cn(
                  "text-4xl font-mono font-bold tracking-tighter",
                  netBalance > 0
                    ? "text-emerald-400"
                    : netBalance < 0
                    ? "text-rose-400"
                    : "text-white"
                )}
              >
                {netBalance > 0 ? "+" : ""}
                {formatCurrency(
                  String(netBalance),
                  balances?.currency || "INR"
                )}
              </div>
            </div>
            <div className="text-right text-sm text-gray-400 font-medium relative z-10">
              {netBalance > 0
                ? "You get back"
                : netBalance < 0
                ? "You owe"
                : "Settled up"}
            </div>
          </div>

          <Tabs defaultValue="balances" className="w-full">
            <TabsList className="bg-muted p-1.5 rounded-2xl w-full sm:w-auto h-14 mb-6">
              <TabsTrigger
                value="balances"
                className="rounded-xl h-full px-6 font-bold"
              >
                Balances
              </TabsTrigger>

              <TabsTrigger
                value="expenses"
                className="rounded-xl h-full px-6 font-bold"
              >
                Expenses
              </TabsTrigger>

              <TabsTrigger
                value="history"
                className="rounded-xl h-full px-6 font-bold"
              >
                Activity
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: BALANCES */}
            <TabsContent
              value="balances"
              className="space-y-6 animate-in fade-in slide-in-from-bottom-2"
            >
              <BalancesList
                balances={balances}
                groupName={group.name}
                onSettleClick={(target) => setSettlementTarget(target)}
              />
            </TabsContent>

            {/* TAB 2: EXPENSES LIST */}
            <TabsContent
              value="expenses"
              className="space-y-4 animate-in fade-in slide-in-from-bottom-2"
            >
              {loadingExpenses ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 w-full rounded-2xl" />
                  ))}
                </div>
              ) : expensesList.length === 0 ? (
                <div className="py-16 text-center border-2 border-dashed border-border rounded-[2.5rem] bg-card">
                  <Receipt className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
                  <p className="text-muted-foreground font-medium">
                    No expenses added yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {expensesList.map((expense: any) => (
                    <GroupExpenseCard key={expense.id} expense={expense} />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* TAB 3: SETTLEMENT HISTORY */}
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
                <div className="py-16 text-center border-2 border-dashed border-border rounded-[2.5rem] bg-card">
                  <ArrowRightLeft className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
                  <p className="text-muted-foreground font-medium">
                    No settlement history.
                  </p>
                </div>
              ) : (
                settlements.map((s: any) => {
                  const isPayer = s.payer.id === user?.id;
                  const isReceiver = s.receiver.id === user?.id;
                  return (
                    <div
                      key={s.id}
                      className="flex items-center justify-between p-4 rounded-2xl border border-border bg-card shadow-sm hover:border-primary/20 transition-all"
                    >
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
                            {isPayer ? "You paid" : `${s.payer.name} paid`}
                            <span className="font-normal text-muted-foreground">
                              {" "}
                              to{" "}
                            </span>
                            {isReceiver ? "You" : s.receiver.name}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {new Date(s.date).toLocaleDateString(undefined, {
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
                        {formatCurrency(s.amount, s.currency)}
                      </span>
                    </div>
                  );
                })
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* --- RIGHT COLUMN: MEMBERS SIDEBAR --- */}
        <div className="lg:col-span-1">
          <div className="rounded-[2.5rem] border border-border bg-card p-6 shadow-sm sticky top-6">
            <div className="flex items-center justify-between mb-6 px-2">
              <h3 className="font-bold text-lg text-foreground">Members</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddMember(true)}
                className="text-primary hover:text-primary hover:bg-primary/5 rounded-full px-3"
              >
                <UserPlus className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>

            <div className="space-y-2">
              {group.members.map((member) => (
                <div
                  key={member.user.id}
                  className="flex items-center justify-between p-3 rounded-2xl hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <Avatar className="h-10 w-10 border border-border">
                      <AvatarImage src={member.user.avatar} />
                      <AvatarFallback className="bg-muted text-muted-foreground font-bold text-xs">
                        {member.user.name[0]}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {member.user.name}
                        {member.user.id === user?.id && " (You)"}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                        {member.role}
                      </p>
                    </div>
                  </div>

                  {isAdmin && member.user.id !== user?.id && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 rounded-full"
                        >
                          <MoreVertical className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="rounded-xl border-border min-w-[160px]"
                      >
                        <DropdownMenuLabel>Manage Member</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() =>
                            updateRole({
                              userId: member.user.id,
                              role:
                                member.role === "ADMIN" ? "MEMBER" : "ADMIN",
                            })
                          }
                        >
                          <Shield className="mr-2 h-4 w-4" />{" "}
                          {member.role === "ADMIN" ? "Demote" : "Promote"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => removeMember(member.user.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <UserMinus className="mr-2 h-4 w-4" /> Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* --- MODALS --- */}
      <SimplifyDebtDialog
        isOpen={showSimplifyModal}
        onClose={() => setShowSimplifyModal(false)}
        payments={optimizedData}
        isLoading={isSimplifying}
        groupId={groupId}
      />
      <AddMemberDialog
        isOpen={showAddMember}
        onClose={() => setShowAddMember(false)}
        groupId={groupId}
        currentMembers={group.members}
      />
      <EditGroupDialog
        isOpen={showEditGroup}
        onClose={() => setShowEditGroup(false)}
        groupId={groupId}
        initialData={{
          name: group.name,
          description: group.description,
          avatar: group.avatar,
        }}
      />

      {settlementTarget && user && (
        <SettlementModal
          isOpen={!!settlementTarget}
          onClose={() => setSettlementTarget(null)}
          currentUser={{
            id: user.id,
            name: user.name,
            avatar: userAvatar,
          }}
          counterparty={{
            id: settlementTarget.id,
            name: settlementTarget.name,
            avatar: settlementTarget.avatar,
          }}
          defaultAmount={settlementTarget.amount}
          context={{ type: "group", groupId: group.id, groupName: group.name }}
        />
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <Skeleton className="h-64 w-full rounded-[2.5rem]" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Skeleton className="h-96 w-full lg:col-span-2 rounded-[2.5rem]" />
        <Skeleton className="h-64 w-full rounded-[2.5rem]" />
      </div>
    </div>
  );
}

function GroupNotFound() {
  const router = useRouter();
  return (
    <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-4">
      <div className="p-6 bg-muted/30 rounded-full">
        <Layers className="h-12 w-12 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-bold text-foreground">Group not found</h2>
      <Button
        variant="outline"
        onClick={() => router.push("/dashboard/groups")}
        className="rounded-xl"
      >
        Back
      </Button>
    </div>
  );
}
