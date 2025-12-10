"use client";

import { useState } from "react";
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
  History,
  ChevronRight,
  Receipt,
} from "lucide-react";

import { useAuthStore } from "@/src/features/auth/store";
import {
  useGroupDetails,
  useGroupBalances,
  useSimplifyDebts,
  useRemoveMember,
  useUpdateMemberRole,
  OptimizedPayment,
} from "@/src/features/groups/api/group-details-query";
import { useSettlements } from "@/src/features/settlements/api/settlement-queries"; // Unified Settlement Hook

import { SimplifyDebtDialog } from "@/src/features/groups/components/SimplifyDebtDialog";
import { AddMemberDialog } from "@/src/features/groups/components/AddMemberDialog";
import { EditGroupDialog } from "@/src/features/groups/components/EditGroupDialog";
import { SettlementModal } from "@/src/features/settlements/components/SettlementModal";

import { Skeleton } from "@/src/components/ui/Skeleton";
import { Button } from "@/src/components/ui/Button";
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
import { formatCurrency } from "@/src/lib/utils";

export default function GroupDetailsPage() {
  const params = useParams();
  const groupId = params?.id as string;
  const user = useAuthStore((state) => state.user);
  const router = useRouter();

  // --- QUERIES ---
  const { data: group, isLoading: loadingGroup } = useGroupDetails(groupId);
  const { data: balances, isLoading: loadingBalances } =
    useGroupBalances(groupId);
  // Fetch Settlements specific to this group
  const { data: settlements, isLoading: loadingSettlements } = useSettlements({
    group_id: groupId,
  });

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
  } | null>(null);
  const [optimizedData, setOptimizedData] = useState<OptimizedPayment[]>([]);

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

      {/* --- HEADER --- */}
      <div className="flex flex-col justify-between gap-6 border-b border-slate-100 pb-8 md:flex-row md:items-start">
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
            {group.name}
          </h1>
          <p className="text-slate-500 text-lg max-w-2xl">
            {group.description || "No description provided."}
          </p>
          <div className="flex items-center gap-3 pt-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-sm font-medium">
              <Users className="h-3.5 w-3.5" />{" "}
              <span>{group.members.length} members</span>
            </div>
            <span className="text-sm text-slate-400">
              Created by {group.owner.name}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <Button
            variant="outline"
            onClick={handleSimplify}
            className="h-11 px-4 border-slate-200"
          >
            <ArrowRightLeft className="mr-2 h-4 w-4 text-slate-500" /> Simplify
            Debts
          </Button>
          <Button asChild className="h-11 px-6 shadow-lg shadow-primary/20">
            <Link href={`/dashboard/expenses/new?groupId=${groupId}`}>
              Add Expense
            </Link>
          </Button>
          {isAdmin && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowEditGroup(true)}
              className="h-11 w-11 rounded-full border border-slate-200"
            >
              <Settings className="h-5 w-5 text-slate-500" />
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* --- LEFT COLUMN: MAIN CONTENT (TABS) --- */}
        <div className="lg:col-span-2 space-y-8">
          {/* Net Balance Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 p-8 text-white shadow-xl">
            <div className="relative z-10">
              <p className="text-slate-400 font-medium text-sm uppercase tracking-wider mb-1">
                Your Net Balance
              </p>
              <div className="text-5xl font-bold font-mono tracking-tight">
                {netBalance > 0 ? "+" : ""}
                {formatCurrency(
                  String(netBalance),
                  balances?.currency || "INR"
                )}
              </div>
              <p className="mt-3 text-sm text-slate-300 font-medium">
                {netBalance > 0
                  ? "You are owed in total."
                  : netBalance < 0
                  ? "You owe in total."
                  : "You are settled up."}
              </p>
            </div>
            <div className="absolute right-0 top-0 h-64 w-64 bg-primary/20 blur-3xl rounded-full translate-x-1/4 -translate-y-1/4 pointer-events-none" />
          </div>

          {/* Tabs: Balances vs History */}
          <Tabs defaultValue="balances" className="w-full">
            <TabsList className="bg-slate-100 p-1 rounded-xl w-full sm:w-auto h-12 mb-6">
              <TabsTrigger
                value="balances"
                className="rounded-lg h-10 px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
              >
                Current Balances
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="rounded-lg h-10 px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
              >
                Settlement History
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: BALANCES */}
            <TabsContent value="balances" className="space-y-6">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary" /> Detailed Breakdown
              </h2>
              <BalancesList
                balances={balances}
                onSettleClick={(target) => setSettlementTarget(target)}
              />
            </TabsContent>

            {/* TAB 2: SETTLEMENT HISTORY */}
            <TabsContent value="history" className="space-y-6">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <History className="h-5 w-5 text-primary" /> Payment Log
              </h2>

              {loadingSettlements ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-xl" />
                  ))}
                </div>
              ) : settlements?.length === 0 ? (
                <div className="p-10 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                  <Receipt className="h-10 w-10 mx-auto mb-3 text-slate-300" />
                  <p className="text-slate-500">
                    No payments recorded in this group yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {settlements.map((s: any) => {
                    const isPayer = s.payer.id === user?.id;
                    const isReceiver = s.receiver.id === user?.id;

                    return (
                      <div
                        key={s.id}
                        className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-all"
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
                            <p className="text-sm text-slate-900">
                              <span className="font-bold">
                                {isPayer ? "You" : s.payer.name}
                              </span>{" "}
                              paid{" "}
                              <span className="font-bold">
                                {isReceiver ? "You" : s.receiver.name}
                              </span>
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
                className="text-primary rounded-full px-3"
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
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600 group-hover:bg-primary group-hover:text-white transition-colors">
                      {member.user.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700 leading-none">
                        {member.user.name}
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
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVertical className="h-4 w-4 text-slate-400" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
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
                          className="text-red-600"
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
        initialData={{ name: group.name, description: group.description }}
      />

      {/* Settle Up Modal */}
      {settlementTarget && user && (
        <SettlementModal
          isOpen={!!settlementTarget}
          onClose={() => setSettlementTarget(null)}
          currentUser={{
            id: user.id,
            name: user.name,
            avatar: user.avatar || user.avatar,
          }}
          counterparty={{
            id: settlementTarget.id,
            name: settlementTarget.name,
          }}
          defaultAmount={settlementTarget.amount}
          context={{ type: "group", groupId: group.id, groupName: group.name }}
        />
      )}
    </div>
  );
}

// Sub-component for Balances List (Same as before, ensuring navigation)
function BalancesList({
  balances,
  onSettleClick,
}: {
  balances: any;
  onSettleClick: (t: any) => void;
}) {
  if (!balances) return null;
  const router = useRouter();

  return (
    <div className="grid gap-6 md:grid-cols-2">
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
                <div className="h-10 w-10 rounded-full bg-rose-50 flex items-center justify-center text-sm font-bold text-rose-600">
                  {item.name[0]}
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-700 group-hover:text-primary transition-colors flex items-center gap-1">
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
          balances.you_are_owed.map((item: any) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-4 rounded-2xl border border-emerald-100 bg-white shadow-sm hover:shadow-md transition-all group cursor-pointer"
              onClick={() => router.push(`/dashboard/friends/${item.id}`)}
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center text-sm font-bold text-emerald-600">
                  {item.name[0]}
                </div>
                <span className="font-semibold text-slate-700 group-hover:text-primary transition-colors">
                  {item.name}
                </span>
              </div>
              <span className="font-bold text-emerald-600 font-mono text-lg">
                {formatCurrency(item.amount, balances.currency)}
              </span>
            </div>
          ))
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
