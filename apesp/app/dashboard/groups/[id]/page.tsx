"use client";

import { useParams } from "next/navigation";
import { Settings, Users, ArrowRightLeft } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/src/features/auth/store";
import {
  useGroupActions,
  useGroupBalances,
  useGroupDetails,
} from "@/src/features/groups/api/group-details-query";
import { Skeleton } from "@/src/components/ui/Skeleton";
import { Button } from "@/src/components/ui/Button";
import { formatCurrency } from "@/src/lib/utils";

export default function GroupDetailsPage() {
  const params = useParams();
  const groupId = params?.id as string;

  const user = useAuthStore((state) => state.user);

  const { data: group, isLoading: loadingGroup } = useGroupDetails(groupId);
  const { data: balances, isLoading: loadingBalances } =
    useGroupBalances(groupId);
  const { simplifyDebts } = useGroupActions(groupId);

  if (!groupId || loadingGroup)
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );

  if (!group)
    return (
      <div className="p-6 text-center text-muted-foreground">
        Group not found
      </div>
    );

  const isAdmin =
    group.members.find((m) => m.user.id === user?.id)?.role === "ADMIN";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-border/50 pb-6 md:flex-row md:items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            {group.name}
          </h1>
          <p className="text-muted-foreground mt-1">
            {group.description || "No description"}
          </p>
          <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md">
              <Users className="h-3.5 w-3.5" />
              <span>{group.members.length} members</span>
            </div>
            <span className="text-slate-300">|</span>
            <span className="text-xs">Created by {group.owner.name}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => simplifyDebts.mutate()}>
            <ArrowRightLeft className="mr-2 h-4 w-4" /> Simplify Debts
          </Button>
          {isAdmin && (
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
          )}
          <Button asChild>
            <Link href={`/dashboard/expenses/new?groupId=${groupId}`}>
              Add Expense
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Balances Section */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold text-slate-800">Balances</h2>
          {loadingBalances ? (
            <Skeleton className="h-40 w-full" />
          ) : balances?.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-12 text-center">
              <p className="text-muted-foreground">
                No outstanding debts in this group.
              </p>
              <p className="text-xs text-slate-400 mt-1">
                You're all settled up! 🎉
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {balances?.map((bal, idx) => {
                const userA =
                  group.members.find((m) => m.user.id === bal.user_A_id)?.user
                    .name || "Unknown";
                const userB =
                  group.members.find((m) => m.user.id === bal.user_B_id)?.user
                    .name || "Unknown";
                const amount = parseFloat(bal.amount);

                const debtor = amount > 0 ? userB : userA;
                const creditor = amount > 0 ? userA : userB;
                const absAmount = Math.abs(amount);

                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-xl border bg-card p-4 shadow-sm transition-all hover:shadow-md"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-rose-600">
                        {debtor}
                      </span>
                      <span className="text-muted-foreground text-sm px-1">
                        owes
                      </span>
                      <span className="font-semibold text-emerald-600">
                        {creditor}
                      </span>
                    </div>
                    <div className="font-bold font-mono text-slate-700">
                      {formatCurrency(String(absAmount), "INR")}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Members Sidebar */}
        <div className="rounded-xl border bg-white p-6 h-fit shadow-sm">
          <h3 className="font-semibold mb-4 text-slate-800">Members</h3>
          <ul className="space-y-4">
            {group.members.map((member) => (
              // FIXED: Use member.user.id as key because member.id doesn't exist
              <li
                key={member.user.id}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {member.user.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">
                      {member.user.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
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
  );
}
