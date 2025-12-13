"use client";

import { useState } from "react";
import { UserPlus, Search } from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import { useFriends } from "@/src/features/friends/api/friend-queries";
import { useAddGroupMember, GroupDetails } from "../api/group-details-query";
import { Input } from "@/src/components/ui/Input";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/src/components/ui/Avatar";
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

  const filteredFriends = friends?.filter((friend) => {
    const isMember = currentMembers.some((m) => m.user.id === friend.id);
    const matchesSearch =
      friend.name.toLowerCase().includes(search.toLowerCase()) ||
      friend.email.toLowerCase().includes(search.toLowerCase());
    return !isMember && matchesSearch;
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-3xl p-6">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl">Add Members</DialogTitle>
        </DialogHeader>

        <div className="relative mb-6">
          <Search className="absolute left-3.5 top-3.5 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search friends..."
            className="pl-11 h-12 rounded-xl bg-muted/30 border-border"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Loading friends...
            </p>
          ) : filteredFriends?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-border rounded-xl bg-muted/10">
              <p>No friends found.</p>
              <p className="text-xs mt-1 opacity-70">
                They might already be in this group.
              </p>
            </div>
          ) : (
            filteredFriends?.map((friend) => (
              <div
                key={friend.id}
                className="flex items-center justify-between p-3 rounded-2xl border border-transparent hover:border-border hover:bg-muted/30 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={friend.avatar} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                      {friend.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {friend.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {friend.email}
                    </p>
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-9 w-9 rounded-full bg-muted/50 hover:bg-primary/10 hover:text-primary transition-colors"
                  disabled={isPending}
                  onClick={() => addMember(friend.id)}
                >
                  <UserPlus className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
