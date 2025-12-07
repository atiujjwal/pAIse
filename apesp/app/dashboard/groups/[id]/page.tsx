"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import {
  Settings,
  Users,
  ArrowRightLeft,
  Wallet,
  UserPlus,
  Trash2,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/src/features/auth/store";
import {
  useGroupDetails,
  useGroupBalances,
  useSimplifyDebts,
  useDeleteGroup,
  OptimizedPayment,
} from "@/src/features/groups/api/group-details-query";
import { SimplifyDebtDialog } from "@/src/features/groups/components/SimplifyDebtDialog";
import { AddMemberDialog } from "@/src/features/groups/components/AddMemberDialog";
import { Skeleton } from "@/src/components/ui/Skeleton";
import { Button } from "@/src/components/ui/Button";
import { formatCurrency } from "@/src/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/Dropdown-menu";

export default function GroupDetailsPage() {
  const params = useParams();
  const groupId = params?.id as string;
  const user = useAuthStore((state) => state.user);

  // --- Queries ---
  const { data: group, isLoading: loadingGroup } = useGroupDetails(groupId);
  const { data: balances, isLoading: loadingBalances } =
    useGroupBalances(groupId);

  // --- Mutations & Logic ---
  const { mutate: deleteGroup, isPending: isDeleting } =
    useDeleteGroup(groupId);

  // Simplify Debt State
  const [showSimplifyModal, setShowSimplifyModal] = useState(false);
  const [optimizedData, setOptimizedData] = useState<OptimizedPayment[]>([]);
  const { mutate: simplify, isPending: isSimplifying } =
    useSimplifyDebts(groupId);

  const handleSimplify = () => {
    setShowSimplifyModal(true);
    simplify(undefined, {
      onSuccess: (data) => setOptimizedData(data),
    });
  };

  // Add Member State
  const [showAddMember, setShowAddMember] = useState(false);

  // --- Loading States ---
  if (!groupId || loadingGroup) {
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

  if (!group) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center">
        <h2 className="text-xl font-semibold text-slate-900">
          Group not found
        </h2>
        <p className="text-slate-500 mt-2">
          This group may have been deleted or you don't have access.
        </p>
        <Button asChild variant="link" className="mt-4">
          <Link href="/dashboard/groups">Back to Groups</Link>
        </Button>
      </div>
    );
  }

  const isAdmin =
    group.members.find((m) => m.user.id === user?.id)?.role === "ADMIN";
  const netBalance = parseFloat(balances?.net_balance || "0");

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* --- HEADER --- */}
      <div className="flex flex-col justify-between gap-6 border-b border-slate-100 pb-8 md:flex-row md:items-start">
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
            {group.name}
          </h1>
          <p className="text-slate-500 text-lg max-w-2xl">
            {group.description || "No description provided."}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-sm font-medium">
              <Users className="h-3.5 w-3.5" />
              <span>{group.members.length} members</span>
            </div>
            <div className="h-1 w-1 rounded-full bg-slate-300" />
            <span className="text-sm text-slate-400">
              Created by {group.owner.name}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <Button
            variant="outline"
            onClick={handleSimplify}
            className="h-11 px-4 border-slate-200 hover:bg-slate-50 hover:text-slate-900"
          >
            <ArrowRightLeft className="mr-2 h-4 w-4 text-slate-500" />
            Simplify Debts
          </Button>

          <Button
            asChild
            className="h-11 px-6 shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 transition-all"
          >
            <Link href={`/dashboard/expenses/new?groupId=${groupId}`}>
              <Plus className="mr-2 h-4 w-4" /> Add Expense
            </Link>
          </Button>

          {/* Admin Actions Dropdown */}
          {isAdmin && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-11 w-11 rounded-full border border-slate-200 hover:bg-slate-100"
                >
                  <Settings className="h-5 w-5 text-slate-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Group Settings</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => deleteGroup()}
                  disabled={isDeleting}
                  className="text-red-600 focus:text-red-600 focus:bg-red-50"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {isDeleting ? "Deleting..." : "Delete Group"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* --- LEFT COL: BALANCES & BREAKDOWN --- */}
        <div className="lg:col-span-2 space-y-8">
          {/* Net Balance Card */}
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
                  ? "You are owed in total across all expenses."
                  : netBalance < 0
                  ? "You owe in total across all expenses."
                  : "You are all settled up in this group."}
              </p>
            </div>
            {/* Artistic Blob */}
            <div className="absolute right-0 top-0 h-64 w-64 bg-primary/20 blur-3xl rounded-full translate-x-1/4 -translate-y-1/4 pointer-events-none" />
          </div>

          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" /> Detailed Breakdown
            </h2>

            {loadingBalances ? (
              <div className="grid gap-4 md:grid-cols-2">
                <Skeleton className="h-32 w-full rounded-xl" />
                <Skeleton className="h-32 w-full rounded-xl" />
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {/* YOU OWE SECTION */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-rose-600 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-rose-500"></span>{" "}
                      You Owe
                    </h3>
                  </div>

                  {balances?.you_owe.length === 0 ? (
                    <div className="p-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-center">
                      <p className="text-slate-400 text-sm">
                        You don't owe anyone.
                      </p>
                    </div>
                  ) : (
                    balances?.you_owe.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-4 rounded-2xl border border-rose-100 bg-white shadow-sm hover:shadow-md transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-rose-50 flex items-center justify-center text-sm font-bold text-rose-600 group-hover:scale-110 transition-transform">
                            {item.name[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-700">
                              {item.name}
                            </p>
                            <p className="text-[10px] text-rose-400 font-medium uppercase">
                              Settlement Pending
                            </p>
                          </div>
                        </div>
                        <span className="font-bold text-rose-600 font-mono text-lg">
                          {formatCurrency(item.amount, balances.currency)}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                {/* YOU ARE OWED SECTION */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>{" "}
                      Owed to You
                    </h3>
                  </div>

                  {balances?.you_are_owed.length === 0 ? (
                    <div className="p-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-center">
                      <p className="text-slate-400 text-sm">No one owes you.</p>
                    </div>
                  ) : (
                    balances?.you_are_owed.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-4 rounded-2xl border border-emerald-100 bg-white shadow-sm hover:shadow-md transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center text-sm font-bold text-emerald-600 group-hover:scale-110 transition-transform">
                            {item.name[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-700">
                              {item.name}
                            </p>
                            <p className="text-[10px] text-emerald-500 font-medium uppercase">
                              Will Pay You
                            </p>
                          </div>
                        </div>
                        <span className="font-bold text-emerald-600 font-mono text-lg">
                          {formatCurrency(item.amount, balances.currency)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* --- RIGHT COL: MEMBERS SIDEBAR --- */}
        <div className="lg:col-span-1">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sticky top-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg text-slate-800">Members</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddMember(true)}
                className="text-primary hover:bg-primary/10 hover:text-primary rounded-full px-3"
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
                  <div className="flex items-center gap-3">
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
                  </div>
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
      />

      <AddMemberDialog
        isOpen={showAddMember}
        onClose={() => setShowAddMember(false)}
        groupId={groupId}
        currentMembers={group.members}
      />
    </div>
  );
}
