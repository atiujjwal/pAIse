"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Plus,
  Users,
  ArrowRight,
  Search,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Layers,
} from "lucide-react";

import { useGroupsList } from "@/src/features/groups/api/group-list-query";
import { CreateGroupDialog } from "@/src/features/groups/components/CreateGroupDialog";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { Skeleton } from "@/src/components/ui/Skeleton";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/src/components/ui/Avatar";
import { useDebounce } from "@/src/hooks/use-debounce";
import { cn, formatCurrency } from "@/src/lib/utils";

// Interface matching the API response
interface GroupListItem {
  id: string;
  name: string;
  description: string | null;
  avatar: string | null;
  owner_id: string;
  created_at: string;
  member_count: number;
  user_balance: string;
  user_status: "settled" | "owe" | "owed";
  has_debts: boolean;
  has_credits: boolean;
  currency: string;
}

export default function GroupsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);

  const { data: groupsData, isLoading } = useGroupsList(debouncedSearch);
  const groups = groupsData as unknown as GroupListItem[];

  const searchParams = useSearchParams();
  const router = useRouter();
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    if (searchParams.get("action") === "create") {
      setShowCreateDialog(true);
      router.replace("/dashboard/groups", { scroll: false });
    }
  }, [searchParams, router]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 max-w-7xl mx-auto">
      {/* --- HEADER --- */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            My Groups
          </h1>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed max-w-md">
            Manage shared expenses, trips, and settlements.
          </p>
        </div>

        <div className="flex gap-3 w-full sm:w-auto">
          <Button
            onClick={() => setShowCreateDialog(true)}
            size="lg"
            className="rounded-xl shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all hover:scale-105 w-full sm:w-auto"
          >
            <Plus className="mr-2 h-5 w-5" /> Create Group
          </Button>
        </div>
      </div>

      {/* --- SEARCH BAR --- */}
      <div className="sticky top-4 z-20">
        <div className="bg-card/80 backdrop-blur-xl p-2 rounded-2xl border border-border shadow-sm ring-1 ring-border/50 max-w-md">
          <div className="relative">
            <Search className="absolute left-3.5 top-3.5 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search groups..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-11 h-12 bg-transparent border-transparent focus:bg-background rounded-xl transition-all"
            />
          </div>
        </div>
      </div>

      {/* --- CONTENT GRID --- */}
      <div className="min-h-[400px]">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-[2.5rem] border border-border bg-card p-6 space-y-4"
              >
                <div className="flex items-center gap-4">
                  <Skeleton className="h-14 w-14 rounded-2xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <Skeleton className="h-20 w-full rounded-2xl" />
              </div>
            ))}
          </div>
        ) : groups && groups.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => {
              const isOwe = group.user_status === "owe";
              const isOwed = group.user_status === "owed";
              const isSettled = group.user_status === "settled";

              return (
                <Link
                  key={group.id}
                  href={`/dashboard/groups/${group.id}`}
                  className="group relative flex flex-col justify-between rounded-[2.5rem] border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-primary/20"
                >
                  <div>
                    {/* Header: Avatar & Member Count */}
                    <div className="flex items-start justify-between mb-4">
                      <Avatar className="h-16 w-16 rounded-2xl border-4 border-background shadow-md">
                        <AvatarImage
                          src={group.avatar || undefined}
                          className="object-cover"
                        />
                        <AvatarFallback className="rounded-2xl bg-gradient-to-br from-primary/10 to-indigo-500/10 text-primary font-bold text-xl">
                          {group.name[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex items-center gap-1.5 rounded-full bg-muted/50 px-3 py-1 text-xs font-bold text-muted-foreground border border-border">
                        <Users className="h-3.5 w-3.5" />
                        {group.member_count}
                      </div>
                    </div>

                    {/* Group Info */}
                    <div className="space-y-1">
                      <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                        {group.name}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 h-10 leading-relaxed">
                        {group.description || "No description provided."}
                      </p>
                    </div>
                  </div>

                  {/* Footer: Balance Status */}
                  <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                        Your Balance
                      </span>
                      <div
                        className={cn(
                          "flex items-center gap-1.5 mt-0.5",
                          isOwe
                            ? "text-destructive"
                            : isOwed
                            ? "text-secondary"
                            : "text-muted-foreground"
                        )}
                      >
                        {isOwe && <TrendingDown className="h-4 w-4" />}
                        {isOwed && <TrendingUp className="h-4 w-4" />}
                        {isSettled && <CheckCircle2 className="h-4 w-4" />}

                        <span className="font-mono font-bold text-lg">
                          {isSettled
                            ? "Settled"
                            : formatCurrency(
                                group.user_balance,
                                group.currency || "INR"
                              )}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-muted/50 group-hover:bg-primary group-hover:text-primary-foreground transition-colors shadow-sm">
                      <ArrowRight className="h-5 w-5" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          /* EMPTY STATE */
          <div className="flex flex-col items-center justify-center py-24 text-center rounded-[2.5rem] border-2 border-dashed border-border bg-muted/10">
            <div className="h-20 w-20 rounded-[2rem] bg-card shadow-sm flex items-center justify-center mb-6 border border-border">
              <Layers className="h-10 w-10 text-muted-foreground/40" />
            </div>
            <h3 className="text-xl font-bold text-foreground">
              {searchTerm ? "No groups found" : "No groups yet"}
            </h3>
            <p className="text-muted-foreground max-w-sm mt-2 mb-8">
              {searchTerm
                ? `We couldn't find any groups matching "${searchTerm}"`
                : "Create a group to split expenses for trips, house rent, or daily lunches with friends."}
            </p>
            {!searchTerm && (
              <Button
                onClick={() => setShowCreateDialog(true)}
                variant="outline"
                className="rounded-xl border-border"
              >
                Create your first group
              </Button>
            )}
          </div>
        )}
      </div>

      {showCreateDialog && (
        <CreateGroupDialog
          isOpen={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
        />
      )}
    </div>
  );
}
