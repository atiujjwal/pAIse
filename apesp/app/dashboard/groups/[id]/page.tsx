"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Settings,
  Plus,
  Receipt,
  Users,
  Wallet,
} from "lucide-react";

import { api } from "@/src/lib/api";
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
import { formatCurrency, cn } from "@/src/lib/utils";

// Components
import { EditGroupDialog } from "@/src/features/groups/components/EditGroupDialog";
import { AddMemberDialog } from "@/src/features/groups/components/AddMemberDialog";
import { SimplifyDebtDialog } from "@/src/features/groups/components/SimplifyDebtDialog";

// Local Component
const GroupExpenseCard = ({ expense }: { expense: any }) => (
  <Link
    href={`/dashboard/expenses/${expense.id}`}
    className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-card shadow-sm hover:border-primary/20 hover:shadow-md transition-all group"
  >
    <div className="flex flex-col items-center justify-center h-12 w-12 shrink-0 rounded-xl bg-muted/30 border border-border text-muted-foreground group-hover:bg-primary/5 group-hover:text-primary transition-colors">
      <span className="text-[10px] font-bold uppercase">
        {new Date(expense.date).toLocaleString("default", { month: "short" })}
      </span>
      <span className="text-sm font-bold">
        {new Date(expense.date).getDate()}
      </span>
    </div>

    <div className="flex-1 min-w-0">
      <p className="font-semibold text-foreground truncate">
        {expense.description}
      </p>
      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
        <Avatar className="h-4 w-4">
          <AvatarImage src={expense.created_by?.avatar} />
          <AvatarFallback className="text-[8px]">
            {expense.created_by?.name?.[0]}
          </AvatarFallback>
        </Avatar>
        <span className="truncate">
          {expense.created_by?.name.split(" ")[0]} paid
        </span>
      </div>
    </div>

    <span className="font-mono font-bold text-foreground text-base">
      {formatCurrency(expense.amount, expense.currency)}
    </span>
  </Link>
);

export default function GroupDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;
  const { user } = useAuthStore();

  const [showEdit, setShowEdit] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showSimplify, setShowSimplify] = useState(false);

  // Fetch Group Data
  const { data: group, isLoading } = useQuery({
    queryKey: ["groups", groupId],
    queryFn: async () => {
      const { data } = await api.get(`/groups/${groupId}`);
      return data.data;
    },
  });

  // Fetch Balances for Simplify
  const { data: optimizeData, isLoading: loadingOptimize } = useQuery({
    queryKey: ["groups", groupId, "optimize"],
    queryFn: async () => {
      const { data } = await api.get(`/groups/${groupId}/debts`);
      return data.data;
    },
    enabled: showSimplify,
  });

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 pt-6 p-4">
        <Skeleton className="h-64 w-full rounded-[2.5rem]" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-14 w-full rounded-2xl" />
            <Skeleton className="h-40 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!group)
    return (
      <div className="text-center py-20 text-muted-foreground">
        Group not found
      </div>
    );

  // Safe accessors
  const members = group.members || [];
  const expenses = group.expenses || [];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in pb-20">
      {/* HEADER CARD */}
      <div className="bg-card rounded-[2.5rem] border border-border shadow-sm p-8 relative overflow-hidden">
        {/* Decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20 z-0 pointer-events-none" />

        <div className="relative z-10">
          <div className="flex justify-between items-start mb-6">
            <Button
              variant="ghost"
              onClick={() => router.push("/dashboard/groups")}
              className="rounded-xl -ml-2 text-muted-foreground hover:text-foreground hover:bg-muted/50"
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowEdit(true)}
              className="rounded-xl border-border bg-background/50 hover:bg-background"
            >
              <Settings className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex flex-col md:flex-row gap-8 items-start md:items-end">
            <Avatar className="h-32 w-32 rounded-3xl border-4 border-background shadow-xl">
              <AvatarImage src={group.avatar} className="object-cover" />
              <AvatarFallback className="rounded-3xl text-4xl font-bold bg-primary/10 text-primary">
                {group.name?.[0]}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-2">
              <h1 className="text-4xl font-extrabold text-foreground tracking-tight">
                {group.name}
              </h1>
              <p className="text-muted-foreground font-medium text-lg">
                {group.description || "No description"}
              </p>

              <div className="flex items-center gap-2 pt-2">
                <div className="flex -space-x-2 overflow-hidden">
                  {/* FIX: Use index fallback for key */}
                  {members.slice(0, 5).map((m: any, idx: number) => (
                    <Avatar
                      key={m.id || `member-${idx}`}
                      className="inline-block h-8 w-8 rounded-full ring-2 ring-card"
                    >
                      <AvatarImage src={m.user?.avatar} />
                      <AvatarFallback className="bg-muted text-xs">
                        {m.user?.name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                <span className="text-xs text-muted-foreground font-medium ml-2">
                  {members.length} members
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddMember(true)}
                  className="h-7 text-xs text-primary hover:text-primary hover:bg-primary/5 rounded-full px-3"
                >
                  + Add
                </Button>
              </div>
            </div>

            <div className="flex gap-3 w-full md:w-auto">
              <Button
                onClick={() => setShowSimplify(true)}
                variant="outline"
                className="flex-1 md:flex-none h-12 rounded-xl border-border hover:bg-muted"
              >
                <Wallet className="h-4 w-4 mr-2" /> Simplify
              </Button>
              <Button
                asChild
                className="flex-1 md:flex-none h-12 rounded-xl shadow-lg shadow-primary/20 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Link href={`/dashboard/expenses/new?groupId=${group.id}`}>
                  <Plus className="h-4 w-4 mr-2" /> Add Expense
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="expenses" className="w-full">
            <TabsList className="bg-muted p-1.5 rounded-2xl w-full sm:w-auto h-14 mb-6">
              <TabsTrigger
                value="expenses"
                className="rounded-xl h-full px-6 font-bold text-sm data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                Expenses
              </TabsTrigger>
              <TabsTrigger
                value="balances"
                className="rounded-xl h-full px-6 font-bold text-sm data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                Balances
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="expenses"
              className="space-y-4 animate-in fade-in slide-in-from-bottom-2"
            >
              {expenses.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-border rounded-[2.5rem] bg-card">
                  <Receipt className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
                  <p className="text-muted-foreground">
                    No expenses in this group yet.
                  </p>
                </div>
              ) : (
                expenses.map((exp: any, idx: number) => (
                  <GroupExpenseCard key={exp.id || idx} expense={exp} />
                ))
              )}
            </TabsContent>

            <TabsContent
              value="balances"
              className="space-y-4 animate-in fade-in slide-in-from-bottom-2"
            >
              <div className="rounded-[2.5rem] border border-border bg-card p-8">
                <h3 className="font-bold text-lg mb-6 text-foreground">
                  Member Balances
                </h3>
                <div className="space-y-4">
                  {members.map((member: any, idx: number) => {
                    const bal = parseFloat(member.balance);
                    const isPos = bal > 0;
                    return (
                      <div
                        key={member.id || idx}
                        className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-transparent hover:border-border transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={member.user?.avatar} />
                            <AvatarFallback>
                              {member.user?.name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-foreground">
                            {member.user?.name}
                          </span>
                        </div>
                        <span
                          className={cn(
                            "font-mono font-bold",
                            bal === 0
                              ? "text-muted-foreground"
                              : isPos
                              ? "text-secondary"
                              : "text-destructive"
                          )}
                        >
                          {isPos ? "+" : ""}
                          {formatCurrency(member.balance, "INR")}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Sidebar Stats */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-[2.5rem] border border-border bg-card p-8 sticky top-6 shadow-sm">
            <h3 className="font-bold text-lg mb-6 text-foreground">
              Group Stats
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-muted/30 rounded-2xl">
                <span className="text-sm text-muted-foreground font-medium">
                  Total Spent
                </span>
                <span className="font-bold text-foreground font-mono">
                  {formatCurrency(group.total_spent || "0", "INR")}
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-muted/30 rounded-2xl">
                <span className="text-sm text-muted-foreground font-medium">
                  Your Balance
                </span>
                <span
                  className={cn(
                    "font-bold font-mono",
                    parseFloat(group.user_balance) >= 0
                      ? "text-secondary"
                      : "text-destructive"
                  )}
                >
                  {formatCurrency(group.user_balance, "INR")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      {showEdit && (
        <EditGroupDialog
          isOpen={showEdit}
          onClose={() => setShowEdit(false)}
          groupId={groupId}
          initialData={{
            name: group.name,
            description: group.description,
            avatar: group.avatar,
          }}
        />
      )}
      {showAddMember && (
        <AddMemberDialog
          isOpen={showAddMember}
          onClose={() => setShowAddMember(false)}
          groupId={groupId}
          currentMembers={members}
        />
      )}
      {showSimplify && (
        <SimplifyDebtDialog
          isOpen={showSimplify}
          onClose={() => setShowSimplify(false)}
          groupId={groupId}
          payments={optimizeData?.payments || []}
          isLoading={loadingOptimize}
        />
      )}
    </div>
  );
}
