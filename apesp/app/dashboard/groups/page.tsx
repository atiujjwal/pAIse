"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Users } from "lucide-react";
import Link from "next/link";
import { api } from "@/src/lib/api";
import { ApiResponse } from "@/src/types/api";
import { Button } from "@/src/components/ui/Button";
import { Skeleton } from "@/src/components/ui/Skeleton";
import { CreateGroupDialog } from "@/src/features/groups/components/CreateGroupDialog";

interface GroupSummary {
  id: string;
  name: string;
  description?: string;
  avatar_url?: string;
  members_count: number; // Often computed or part of metadata
}

export default function GroupsListPage() {
  const [showCreate, setShowCreate] = useState(false);

  const { data: groups, isLoading } = useQuery({
    queryKey: ["groups"],
    queryFn: async () => {
      // [cite_start]; // Integration: GET /api/users/me/groups [cite: 33, 209]
      const { data } = await api.get<ApiResponse<{ groups: GroupSummary[] }>>(
        "api/users/me/groups"
      );
      return data.data!.groups;
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">My Groups</h1>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" /> Create Group
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : groups?.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed text-muted-foreground">
          <Users className="mb-4 h-12 w-12 opacity-20" />
          <p className="text-lg font-medium">No groups yet</p>
          <p className="text-sm">
            Create a group to split expenses with friends.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {groups?.map((group) => (
            <Link
              key={group.id}
              href={`/groups/${group.id}`}
              className="group relative flex flex-col justify-between rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/50"
            >
              <div>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-xl font-bold text-primary">
                  {group.avatar_url ? (
                    <img src={group.avatar_url} alt={group.name} />
                  ) : (
                    group.name[0]
                  )}
                </div>
                <h3 className="font-semibold">{group.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {group.description || "No description"}
                </p>
              </div>
              <div className="mt-4 flex items-center text-xs text-muted-foreground">
                <Users className="mr-1 h-3 w-3" />
                View Details
              </div>
            </Link>
          ))}
        </div>
      )}

      {showCreate && <CreateGroupDialog onClose={() => setShowCreate(false)} />}
    </div>
  );
}
