"use client";

import { useParams } from "next/navigation";
import { Settings, Users, ArrowRightLeft } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/src/features/auth/store";
import { useGroupActions, useGroupBalances, useGroupDetails } from "@/src/features/groups/api/group-details-query";
import { Skeleton } from "@/src/components/ui/Skeleton";
import { Button } from "@/src/components/ui/Button";
import { formatCurrency } from "@/src/lib/utils";

export default function GroupDetailsPage() {
  const params = useParams();
  const groupId = params.groupId as string;
  const user = useAuthStore((state) => state.user);

  const { data: group, isLoading: loadingGroup } = useGroupDetails(groupId);
  const { data: balances, isLoading: loadingBalances } =
    useGroupBalances(groupId);
  const { simplifyDebts } = useGroupActions(groupId);

  if (loadingGroup)
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  if (!group) return <div>Group not found</div>;

  const isAdmin =
    group.members.find((m) => m.user.id === user?.id)?.role === "ADMIN";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b pb-6 md:flex-row md:items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{group.name}</h1>
          <p className="text-muted-foreground">
            {group.description || "No description"}
          </p>
          <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{group.members.length} members</span>
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
            <Link href={`dashboard/expenses/new?groupId=${groupId}`}>
              Add Expense
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Balances Section */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold">Balances</h2>
          {loadingBalances ? (
            <Skeleton className="h-40 w-full" />
          ) : balances?.length === 0 ? (
            <p className="text-muted-foreground">
              No outstanding debts in this group.
            </p>
          ) : (
            <div className="grid gap-4">
              {balances?.map((bal, idx) => {
                // Logic to display "Alice owes Bob" friendly text
                // Backend sends { user_A_id, user_B_id, amount } [cite: 84]
                // This requires mapping IDs to Names using group.members
                const userA =
                  group.members.find((m) => m.user.id === bal.user_A_id)?.user
                    .name || "Unknown";
                const userB =
                  group.members.find((m) => m.user.id === bal.user_B_id)?.user
                    .name || "Unknown";
                const amount = parseFloat(bal.amount);

                // Convention: Positive = B owes A. Negative = A owes B. [cite: 86]
                const debtor = amount > 0 ? userB : userA;
                const creditor = amount > 0 ? userA : userB;
                const absAmount = Math.abs(amount);

                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex items-center gap-2">
                      <div className="font-medium text-red-600">{debtor}</div>
                      <span className="text-muted-foreground text-sm">
                        owes
                      </span>
                      <div className="font-medium text-green-600">
                        {creditor}
                      </div>
                    </div>
                    <div className="font-bold">
                      {formatCurrency(String(absAmount), "INR")}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Members Sidebar */}
        <div className="rounded-lg border bg-card p-6 h-fit">
          <h3 className="font-semibold mb-4">Members</h3>
          <ul className="space-y-4">
            {group.members.map((member) => (
              <li key={member.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs">
                    {member.user.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{member.user.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {member.role.toLowerCase()}
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
