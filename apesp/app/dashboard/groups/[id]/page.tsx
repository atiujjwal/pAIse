"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Settings, Users, ArrowRightLeft, Wallet } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/src/features/auth/store";
import {
  useGroupDetails,
  useGroupBalances,
  useSimplifyDebts,
  OptimizedPayment,
} from "@/src/features/groups/api/group-details-query";
import { SimplifyDebtDialog } from "@/src/features/groups/components/SimplifyDebtDialog";
import { Skeleton } from "@/src/components/ui/Skeleton";
import { Button } from "@/src/components/ui/Button";
import { formatCurrency } from "@/src/lib/utils";

export default function GroupDetailsPage() {
  const params = useParams();
  const groupId = params?.id as string;
  const user = useAuthStore((state) => state.user);

  // Queries
  const { data: group, isLoading: loadingGroup } = useGroupDetails(groupId);
  const { data: balances, isLoading: loadingBalances } =
    useGroupBalances(groupId);

  // Simplify Debt Logic
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

  if (!groupId || loadingGroup) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-16 w-1/3" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Skeleton className="h-64 w-full lg:col-span-2" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!group)
    return (
      <div className="p-12 text-center text-slate-500">Group not found</div>
    );

  const isAdmin =
    group.members.find((m) => m.user.id === user?.id)?.role === "ADMIN";
  const netBalance = parseFloat(balances?.net_balance || "0");

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* --- HEADER --- */}
      <div className="flex flex-col justify-between gap-6 border-b border-slate-100 pb-8 md:flex-row md:items-start">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
            {group.name}
          </h1>
          <p className="text-slate-500 mt-2 text-lg">
            {group.description || "No description"}
          </p>
          <div className="mt-4 flex items-center gap-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-sm font-medium">
              <Users className="h-4 w-4" />
              <span>{group.members.length} members</span>
            </div>
            <span className="text-slate-300 text-sm">
              Created by {group.owner.name}
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleSimplify}
            className="h-11 px-5 border-slate-200"
          >
            <ArrowRightLeft className="mr-2 h-4 w-4 text-slate-500" /> Simplify
            Debts
          </Button>
          {isAdmin && (
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11 border border-slate-200"
            >
              <Settings className="h-5 w-5 text-slate-500" />
            </Button>
          )}
          <Button asChild className="h-11 px-6 shadow-lg shadow-primary/20">
            <Link href={`/dashboard/expenses/new?groupId=${groupId}`}>
              Add Expense
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* --- LEFT COL: BALANCES --- */}
        <div className="lg:col-span-2 space-y-6">
          {/* Net Balance Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-slate-400 font-medium text-sm uppercase tracking-wider">
                Your Net Balance
              </p>
              <div className="mt-2 text-4xl font-bold font-mono">
                {netBalance > 0 ? "+" : ""}
                {formatCurrency(
                  String(netBalance),
                  balances?.currency || "INR"
                )}
              </div>
              <p className="mt-2 text-sm text-slate-300">
                {netBalance > 0
                  ? "You are owed in total"
                  : netBalance < 0
                  ? "You owe in total"
                  : "You are settled up"}
              </p>
            </div>
            {/* Decorative blob */}
            <div className="absolute right-0 top-0 h-48 w-48 bg-primary/20 blur-3xl rounded-full translate-x-1/3 -translate-y-1/3" />
          </div>

          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" /> Detailed Breakdown
          </h2>

          {loadingBalances ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {/* YOU OWE (Red) */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-rose-600 uppercase tracking-wider">
                  You Owe
                </h3>
                {balances?.you_owe.length === 0 ? (
                  <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 text-slate-400 text-sm italic">
                    You don't owe anyone.
                  </div>
                ) : (
                  balances?.you_owe.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 rounded-xl border border-rose-100 bg-rose-50/30"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-rose-100 flex items-center justify-center text-sm font-bold text-rose-700">
                          {item.name[0]}
                        </div>
                        <span className="font-medium text-slate-700">
                          {item.name}
                        </span>
                      </div>
                      <span className="font-bold text-rose-600 font-mono">
                        {formatCurrency(item.amount, balances.currency)}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* YOU ARE OWED (Green) */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-emerald-600 uppercase tracking-wider">
                  Owed to You
                </h3>
                {balances?.you_are_owed.length === 0 ? (
                  <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 text-slate-400 text-sm italic">
                    No one owes you.
                  </div>
                ) : (
                  balances?.you_are_owed.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 rounded-xl border border-emerald-100 bg-emerald-50/30"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-sm font-bold text-emerald-700">
                          {item.name[0]}
                        </div>
                        <span className="font-medium text-slate-700">
                          {item.name}
                        </span>
                      </div>
                      <span className="font-bold text-emerald-600 font-mono">
                        {formatCurrency(item.amount, balances.currency)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* --- RIGHT COL: MEMBERS --- */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sticky top-6">
            <h3 className="font-bold text-lg mb-6 text-slate-800">
              Group Members
            </h3>
            <ul className="space-y-4">
              {group.members.map((member) => (
                <li
                  key={member.user.id}
                  className="flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-slate-600 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      {member.user.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">
                        {member.user.name}
                      </p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                        {member.role}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
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
    </div>
  );
}
