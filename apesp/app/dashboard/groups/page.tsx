"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Users, ArrowRight, Layers, Search } from "lucide-react";

import { useGroupsList } from "@/src/features/groups/api/group-list-query";
import { CreateGroupDialog } from "@/src/features/groups/components/CreateGroupDialog";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { Skeleton } from "@/src/components/ui/Skeleton";
import { useDebounce } from "@/src/hooks/use-debounce";
import { cn } from "@/src/lib/utils"; // Ensure cn is imported

export default function GroupsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);

  const { data: groups, isLoading } = useGroupsList(debouncedSearch);

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
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* --- HEADER --- */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              My Groups
            </h1>
            <p className="text-slate-500 mt-1">
              Manage your shared expenses and settlements.
            </p>
          </div>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 transition-all"
          >
            <Plus className="mr-2 h-4 w-4" /> Create Group
          </Button>
        </div>

        {/* --- SEARCH BAR --- */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search groups..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-11 bg-white border-slate-200 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* --- CONTENT GRID --- */}
      <div className="min-h-[400px]">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-slate-100 p-6 space-y-4"
              >
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <Skeleton className="h-16 w-full" />
              </div>
            ))}
          </div>
        ) : groups && groups.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => (
              <Link
                key={group.id}
                href={`/dashboard/groups/${group.id}`}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md hover:border-primary/30"
              >
                <div>
                  <div className="flex items-start justify-between">
                    {/* FIXED: Show Avatar Image if available, else show Initial */}
                    <div
                      className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-xl overflow-hidden font-bold text-lg",
                        !group.avatar
                          ? "bg-gradient-to-br from-primary/10 to-purple-500/10 text-primary"
                          : "bg-slate-50"
                      )}
                    >
                      {group.avatar ? (
                        <img
                          src={group.avatar}
                          alt={group.name}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            // Fallback to initial if image fails to load
                            e.currentTarget.style.display = "none";
                            e.currentTarget.parentElement!.classList.add(
                              "bg-gradient-to-br",
                              "from-primary/10",
                              "to-purple-500/10",
                              "text-primary"
                            );
                            e.currentTarget.parentElement!.innerText =
                              group.name[0].toUpperCase();
                          }}
                        />
                      ) : (
                        group.name[0].toUpperCase()
                      )}
                    </div>

                    {/* Dynamic Member Count */}
                    <div className="flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-500">
                      <Users className="h-3 w-3" />
                      {group.member_count}
                    </div>
                  </div>

                  <h3 className="mt-4 text-lg font-bold text-slate-900 group-hover:text-primary transition-colors">
                    {group.name}
                  </h3>

                  <p className="mt-2 text-sm text-slate-500 line-clamp-2 leading-relaxed">
                    {group.description || "No description provided."}
                  </p>
                </div>

                <div className="mt-6 flex items-center text-sm font-medium text-primary opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0">
                  View Details <ArrowRight className="ml-1 h-4 w-4" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          /* EMPTY STATE */
          <div className="flex flex-col items-center justify-center py-20 text-center rounded-3xl border-2 border-dashed border-slate-100 bg-slate-50/50">
            <div className="h-20 w-20 rounded-full bg-white shadow-sm flex items-center justify-center mb-6">
              <Layers className="h-10 w-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              {searchTerm ? "No groups found" : "No groups yet"}
            </h3>
            <p className="text-slate-500 max-w-sm mt-2 mb-8">
              {searchTerm
                ? `We couldn't find any groups matching "${searchTerm}"`
                : "Create a group to split expenses for trips, house rent, or daily lunches with friends."}
            </p>
            {!searchTerm && (
              <Button
                onClick={() => setShowCreateDialog(true)}
                variant="outline"
                className="border-slate-300"
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
