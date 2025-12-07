"use client";

import { useState } from "react";
import { UserPlus, Search, User as UserIcon } from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import { useFriends } from "@/src/features/friends/api/friend-queries";
import { useAddGroupMember } from "../api/group-details-query";
import { Input } from "@/src/components/ui/Input";
import { GroupDetails } from "../api/group-details-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/Dialog";

interface AddMemberDialogProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  currentMembers: GroupDetails["members"];
}

export function AddMemberDialog({
  isOpen,
  onClose,
  groupId,
  currentMembers,
}: AddMemberDialogProps) {
  const [search, setSearch] = useState("");
  const { data: friends, isLoading } = useFriends();
  const { mutate: addMember, isPending } = useAddGroupMember(groupId);

  // Filter friends: Must match search AND not already be in the group
  const filteredFriends = friends?.filter((friend) => {
    const isMember = currentMembers.some((m) => m.user.id === friend.id);
    const matchesSearch =
      friend.name.toLowerCase().includes(search.toLowerCase()) ||
      friend.email.toLowerCase().includes(search.toLowerCase());
    return !isMember && matchesSearch;
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Members to Group</DialogTitle>
        </DialogHeader>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search friends..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
          {isLoading ? (
            <p className="text-sm text-slate-500 text-center py-4">
              Loading friends...
            </p>
          ) : filteredFriends?.length === 0 ? (
            <div className="text-center py-6 text-slate-500">
              <p>No friends found to add.</p>
              <p className="text-xs mt-1">
                They might already be in this group.
              </p>
            </div>
          ) : (
            filteredFriends?.map((friend) => (
              <div
                key={friend.id}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                    {friend.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{friend.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {friend.email}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  disabled={isPending}
                  onClick={() => addMember(friend.id)}
                >
                  <UserPlus className="h-4 w-4 text-primary" />
                </Button>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
