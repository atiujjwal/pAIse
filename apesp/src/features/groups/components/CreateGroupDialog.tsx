"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X } from "lucide-react";
import { User } from "@/src/lib/types";
import { useToastStore } from "@/src/hooks/use-toast";
import { api } from "@/src/lib/api";
import { Label } from "@radix-ui/react-label";
import { Input } from "@/src/components/ui/Input";
import { UserSearch } from "../../users/components/UserSearch";
import { Button } from "@/src/components/ui/Button";


// Schema matches Backend [Source 521]
const createGroupSchema = z.object({
  name: z.string().min(1, "Group name is required"),
  description: z.string().optional(),
});

type CreateGroupInput = z.infer<typeof createGroupSchema>;

export function CreateGroupDialog({ onClose }: { onClose: () => void }) {
  const [members, setMembers] = useState<User[]>([]);
  const { addToast } = useToastStore();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateGroupInput>({
    resolver: zodResolver(createGroupSchema),
  });

  const mutation = useMutation({
    mutationFn: async (data: CreateGroupInput) => {
      // API Integration: POST /api/groups
      await api.post("api/groups", {
        ...data,
        members: members.map((m) => m.id), // Send array of IDs
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      addToast("Group created successfully", "success");
      onClose();
    },
    onError: () => {
      addToast("Failed to create group", "error");
    },
  });

  const addMember = (user: User) => {
    if (!members.find((m) => m.id === user.id)) {
      setMembers([...members, user]);
    }
  };

  const removeMember = (userId: string) => {
    setMembers(members.filter((m) => m.id !== userId));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Create New Group</h2>
          <button onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit((data) => mutation.mutate(data))}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label>Group Name</Label>
            <Input {...register("name")} placeholder="e.g., Summer Trip" />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Description (Optional)</Label>
            <Input
              {...register("description")}
              placeholder="What's this group for?"
            />
          </div>

          <div className="space-y-2">
            <Label>Add Members</Label>
            <UserSearch
              onSelect={addMember}
              selectedIds={members.map((m) => m.id)}
            />

            {/* Selected Members Chips */}
            <div className="flex flex-wrap gap-2 mt-2">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs"
                >
                  <span>{member.name}</span>
                  <button
                    type="button"
                    onClick={() => removeMember(member.id)}
                    className="ml-1 text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Creating..." : "Create Group"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
