"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Settings,
  Users,
  ArrowRightLeft,
  Wallet,
  UserPlus,
  MoreVertical,
  Shield,
  UserMinus,
  ArrowLeft,
  Receipt,
  Check,
  ChevronRight,
  Loader2,
  Calendar,
  Layers,
  User,
  PieChart,
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
import { useRemindFriend } from "@/src/features/friends/api/friend-queries";

import { SimplifyDebtDialog } from "@/src/features/groups/components/SimplifyDebtDialog";
import { AddMemberDialog } from "@/src/features/groups/components/AddMemberDialog";
import { EditGroupDialog } from "@/src/features/groups/components/EditGroupDialog";
import { SettlementModal } from "@/src/features/settlements/components/SettlementModal";

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
  // In a Group view, we don't need to show the Group Avatar (context is known).
  // Instead, we show the Creator's Avatar to indicate "Who added this".
  const avatarUrl = expense.created_by.avatar;
  const displayName = expense.created_by.name;

  return (
    <Link
      href={`/dashboard/expenses/${expense.id}`}
      className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-all group"
    >
      {/* Dynamic Avatar Section */}
      <Avatar className="h-10 w-10 border border-slate-100 shadow-sm group-hover:border-indigo-100 transition-colors">
        <AvatarImage src={avatarUrl || undefined} className="object-cover" />
        <AvatarFallback className="bg-indigo-50 text-indigo-600 text-xs font-bold">
          {displayName?.[0]?.toUpperCase()}
        </AvatarFallback>
      </Avatar>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h4 className="font-semibold text-sm text-slate-900 truncate">
            {expense.description}
          </h4>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>
              {new Date(expense.date).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
          <span className="text-slate-300">•</span>
          <span className="capitalize">{expense.category}</span>
          <span className="text-slate-300">•</span>
          <span className="truncate max-w-[100px]">
            Added by {displayName.split(" ")[0]}
          </span>
        </div>
      </div>

      {/* Amount Section */}
      <div className="text-right">
        <span className="block font-bold text-slate-900 font-mono text-sm">
          {formatCurrency(expense.amount, expense.currency)}
        </span>
        <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">
          {expense.split_type}
        </span>
      </div>
    </Link>
  );
};

// --- MAIN PAGE ---

export default function GroupDetailsPage() {
  const params = useParams();
  const groupId = params?.id as string;
  const { user, accessToken } = useAuthStore((state) => state);
  const router = useRouter();

  // --- QUERIES ---
  const { data: group, isLoading: loadingGroup } = useGroupDetails(groupId);
  const { data: balances, isLoading: loadingBalances } =
    useGroupBalances(groupId);
  // Note: expensesResponse will now contain { data: [...], meta: ... }
  const { data: expensesResponse, isLoading: loadingExpenses } =
    useGroupExpenses(groupId);
    console.log("143: ", groupId, expensesResponse);
    
  const { data: settlements, isLoading: loadingSettlements } = useSettlements({
    group_id: groupId,
  });

  // Extract the actual list from the new API structure
  // Handle both potential structures (array vs object) for safety during migration
  const expensesList = Array.isArray(expensesResponse)
    ? expensesResponse
    : [];

  // --- MUTATIONS ---
  const { mutate: removeMember } = useRemoveMember(groupId);
  const { mutate: updateRole } = useUpdateMemberRole(groupId);
  const { mutate: simplify, isPending: isSimplifying } =
    useSimplifyDebts(groupId);

  // --- STATE ---
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
    // ... existing token decoding logic ...
    return null;
  }, [user, accessToken]);

  // --- HANDLERS ---
  const handleSimplify = () => {
    setShowSimplifyModal(true);
    simplify(undefined, { onSuccess: (data) => setOptimizedData(data) });
  };

  if (!groupId || loadingGroup) return <LoadingSkeleton />;
  if (!group) return <GroupNotFound />;

  const isAdmin =
    group.members.find((m) => m.user.id === user?.id)?.role === "ADMIN";
  const netBalance = parseFloat(balances?.net_balance || "0");

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Back Button */}
      <div className="mb-2">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="text-slate-500 hover:text-slate-900 -ml-3"
        >
          <Link href="/dashboard/groups">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Groups
          </Link>
        </Button>
      </div>

      {/* HEADER SECTION */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between gap-6 md:items-start">
          <div className="flex gap-5">
            <div
              className={cn(
                "h-24 w-24 flex-shrink-0 rounded-2xl overflow-hidden border-4 border-white shadow-md flex items-center justify-center",
                !group.avatar
                  ? "bg-gradient-to-br from-indigo-50 to-purple-50 text-indigo-500"
                  : "bg-white"
              )}
            >
              {group.avatar ? (
                <img
                  src={group.avatar}
                  alt={group.name}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <span className="text-3xl font-bold">
                  {group.name[0].toUpperCase()}
                </span>
              )}
            </div>

            <div className="space-y-1">
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 leading-tight">
                {group.name}
              </h1>
              <p className="text-slate-500 text-lg max-w-xl line-clamp-2">
                {group.description || "No description provided."}
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold uppercase tracking-wide">
                  <Users className="h-3.5 w-3.5" />
                  <span>{group.members.length} Members</span>
                </div>
                <div className="text-xs text-slate-400 font-medium">
                  Created by {group.owner.name}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 items-center md:self-center">
            <Button
              variant="outline"
              onClick={handleSimplify}
              className="h-10 border-slate-200 hover:bg-slate-50"
            >
              <ArrowRightLeft className="mr-2 h-4 w-4 text-slate-500" />
              Simplify
            </Button>
            <Button
              asChild
              className="h-10 px-6 shadow-lg shadow-indigo-500/20"
            >
              <Link href={`/dashboard/expenses/new?groupId=${groupId}`}>
                <Receipt className="mr-2 h-4 w-4" /> Add Expense
              </Link>
            </Button>
            {isAdmin && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowEditGroup(true)}
                className="h-10 w-10 rounded-full border border-slate-200 hover:bg-slate-100"
              >
                <Settings className="h-5 w-5 text-slate-500" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* --- LEFT COLUMN: TABS --- */}
        <div className="lg:col-span-2 space-y-6">
          {/* NET BALANCE CARD */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-lg flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
                Your Net Balance
              </p>
              <div
                className={cn(
                  "text-3xl font-mono font-bold",
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
            <div className="text-right text-sm text-slate-300 font-medium">
              {netBalance > 0
                ? "You get back"
                : netBalance < 0
                ? "You owe"
                : "Settled up"}
            </div>
          </div>

          <Tabs defaultValue="expenses" className="w-full">
            <TabsList className="bg-slate-100 p-1 rounded-xl w-full sm:w-auto h-12 mb-6">
              <TabsTrigger value="expenses" className="rounded-lg h-10 px-6">
                Expenses
              </TabsTrigger>
              <TabsTrigger value="balances" className="rounded-lg h-10 px-6">
                Balances
              </TabsTrigger>
              <TabsTrigger value="history" className="rounded-lg h-10 px-6">
                Activity
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: EXPENSES LIST (UPDATED UI) */}
            <TabsContent value="expenses" className="space-y-4">
              {loadingExpenses ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-3 w-1/4" />
                      </div>
                      <Skeleton className="h-8 w-20" />
                    </div>
                  ))}
                </div>
              ) : expensesList.length === 0 ? (
                <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                  <Receipt className="h-10 w-10 mx-auto mb-3 text-slate-300" />
                  <p className="text-slate-500">No expenses added yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {expensesList.map((expense: any) => (
                    <GroupExpenseCard key={expense.id} expense={expense} />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* TAB 2: BALANCES */}
            <TabsContent value="balances" className="space-y-6">
              <BalancesList
                balances={balances}
                groupName={group.name}
                onSettleClick={(target) => setSettlementTarget(target)}
              />
            </TabsContent>

            {/* TAB 3: SETTLEMENT HISTORY */}
            <TabsContent value="history" className="space-y-4">
              {loadingSettlements ? (
                <Skeleton className="h-40 w-full rounded-2xl" />
              ) : settlements?.length === 0 ? (
                <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                  <ArrowRightLeft className="h-10 w-10 mx-auto mb-3 text-slate-300" />
                  <p className="text-slate-500">No settlement history.</p>
                </div>
              ) : (
                settlements.map((s: any) => {
                  const isPayer = s.payer.id === user?.id;
                  const isReceiver = s.receiver.id === user?.id;
                  return (
                    <div
                      key={s.id}
                      className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-white shadow-sm"
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
                          <p className="text-sm font-semibold text-slate-900">
                            {isPayer ? "You paid" : `${s.payer.name} paid`}
                            <span className="font-normal text-slate-500">
                              {" "}
                              to{" "}
                            </span>
                            {isReceiver ? "You" : s.receiver.name}
                          </p>
                          <p className="text-xs text-slate-400">
                            {new Date(s.date).toLocaleDateString(undefined, {
                              dateStyle: "medium",
                            })}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`font-mono font-bold ${
                          isPayer ? "text-rose-600" : "text-emerald-600"
                        }`}
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
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sticky top-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg text-slate-800">Members</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddMember(true)}
                className="text-indigo-600 rounded-full px-3 hover:bg-indigo-50"
              >
                <UserPlus className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>

            <div className="space-y-1">
              {group.members.map((member) => (
                <div
                  key={member.user.id}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors group"
                >
                  <Link
                    href={`/dashboard/friends/${member.user.id}`}
                    className="flex items-center gap-3 flex-1 cursor-pointer"
                  >
                    <Avatar className="h-9 w-9 border border-white shadow-sm">
                      <AvatarImage src={member.user.avatar} />
                      <AvatarFallback className="bg-slate-100 text-slate-600 font-bold text-xs">
                        {member.user.name[0]}
                      </AvatarFallback>
                    </Avatar>

                    <div>
                      <p className="text-sm font-medium text-slate-700 leading-none">
                        {member.user.name}
                        {member.user.id === user?.id && " (You)"}
                      </p>
                      <p className="text-[10px] text-slate-400 font-semibold mt-1 uppercase tracking-wide">
                        {member.role}
                      </p>
                    </div>
                  </Link>
                  {isAdmin && member.user.id !== user?.id && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100"
                        >
                          <MoreVertical className="h-4 w-4 text-slate-400" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="bg-white border border-slate-100 shadow-xl rounded-xl z-50 min-w-[160px] p-1"
                      >
                        <DropdownMenuLabel className="px-2 py-1.5 text-xs font-semibold text-slate-500 uppercase">
                          Manage
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="-mx-1 my-1 h-px bg-slate-100" />
                        <DropdownMenuItem
                          className="cursor-pointer hover:bg-slate-50 rounded-lg px-2 py-2"
                          onClick={() =>
                            updateRole({
                              userId: member.user.id,
                              role:
                                member.role === "ADMIN" ? "MEMBER" : "ADMIN",
                            })
                          }
                        >
                          <Shield className="mr-2 h-4 w-4" />
                          {member.role === "ADMIN" ? "Demote" : "Promote"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-rose-600 focus:text-rose-600 cursor-pointer hover:bg-rose-50 rounded-lg px-2 py-2"
                          onClick={() => removeMember(member.user.id)}
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

// --- BALANCES LIST (Reused Logic) ---
function BalancesList({
  balances,
  onSettleClick,
  groupName,
}: {
  balances: any;
  onSettleClick: (t: any) => void;
  groupName: string;
}) {
  if (!balances) return null;
  const router = useRouter();
  const { mutate: remindFriend, isPending: isReminding } = useRemindFriend();
  const [remindedSet, setRemindedSet] = useState<Set<string>>(new Set());

  const handleRemind = (userId: string, amount: string) => {
    if (remindedSet.has(userId)) return;
    const formattedAmount = formatCurrency(amount, balances.currency);

    remindFriend(
      {
        friendId: userId,
        amount: formattedAmount,
        message: `Reminder: You owe ${formattedAmount} in group "${groupName}".`,
      },
      { onSuccess: () => setRemindedSet((prev) => new Set(prev).add(userId)) }
    );
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* YOU OWE */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-rose-600 uppercase tracking-wider flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-rose-500"></span> You Owe
        </h3>
        {balances.you_owe.length === 0 ? (
          <div className="p-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-center">
            <p className="text-slate-400 text-sm">You don't owe anyone.</p>
          </div>
        ) : (
          balances.you_owe.map((item: any) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-4 rounded-2xl border border-rose-100 bg-white shadow-sm hover:shadow-md transition-all group"
            >
              <div
                className="flex items-center gap-3 cursor-pointer flex-1"
                onClick={() => router.push(`/dashboard/friends/${item.id}`)}
              >
                <Avatar className="h-10 w-10 border border-white shadow-sm">
                  <AvatarImage src={item.avatar} />
                  <AvatarFallback className="bg-rose-50 text-rose-600 font-bold">
                    {item.name[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-700 group-hover:text-indigo-600 transition-colors flex items-center gap-1">
                    {item.name}{" "}
                    <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100" />
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Tap to see details
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="font-bold text-rose-600 font-mono text-lg">
                  {formatCurrency(item.amount, balances.currency)}
                </span>
                <Button
                  size="sm"
                  className="h-7 text-xs bg-rose-600 hover:bg-rose-700 text-white"
                  onClick={() =>
                    onSettleClick({
                      id: item.id,
                      name: item.name,
                      amount: item.amount,
                      avatar: item.avatar,
                    })
                  }
                >
                  Settle
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* OWED TO YOU */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Owed to
          You
        </h3>
        {balances.you_are_owed.length === 0 ? (
          <div className="p-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-center">
            <p className="text-slate-400 text-sm">No one owes you.</p>
          </div>
        ) : (
          balances.you_are_owed.map((item: any) => {
            const isReminded = remindedSet.has(item.id);
            return (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 rounded-2xl border border-emerald-100 bg-white shadow-sm hover:shadow-md transition-all group"
              >
                <div
                  className="flex items-center gap-3 cursor-pointer flex-1"
                  onClick={() => router.push(`/dashboard/friends/${item.id}`)}
                >
                  <Avatar className="h-10 w-10 border border-white shadow-sm">
                    <AvatarImage src={item.avatar} />
                    <AvatarFallback className="bg-emerald-50 text-emerald-600 font-bold">
                      {item.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-semibold text-slate-700 group-hover:text-indigo-600 transition-colors">
                    {item.name}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="font-bold text-emerald-600 font-mono text-lg">
                    {formatCurrency(item.amount, balances.currency)}
                  </span>
                  <Button
                    size="sm"
                    className={`h-7 text-xs transition-colors ${
                      isReminded
                        ? "bg-slate-100 text-slate-400 hover:bg-slate-100 cursor-default"
                        : "bg-emerald-600 hover:bg-emerald-700 text-white"
                    }`}
                    onClick={() => handleRemind(item.id, item.amount)}
                    disabled={isReminding || isReminded}
                  >
                    {isReminding ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : isReminded ? (
                      "Reminded"
                    ) : (
                      "Remind"
                    )}
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center border-b pb-6">
        <div className="space-y-2 w-1/3">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Skeleton className="h-64 w-full lg:col-span-2 rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    </div>
  );
}

function GroupNotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-[50vh] text-center">
      <h2 className="text-xl font-semibold text-slate-900">Group not found</h2>
      <Button asChild variant="link" className="mt-4">
        <Link href="/dashboard/groups">Back to Groups</Link>
      </Button>
    </div>
  );
}
