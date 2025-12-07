"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useUpdateGroupDetails,
  useDeleteGroup,
} from "../api/group-details-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/Dialog";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { Label } from "@/src/components/ui/label";
import { Loader2, Trash2, AlertTriangle } from "lucide-react";

const updateGroupSchema = z.object({
  name: z.string().min(1, "Group name is required"),
  description: z.string().optional(),
});

interface EditGroupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  initialData: { name: string; description?: string };
}

export function EditGroupDialog({
  isOpen,
  onClose,
  groupId,
  initialData,
}: EditGroupDialogProps) {
  const { mutate: updateGroup, isPending: isUpdating } =
    useUpdateGroupDetails(groupId);
  const { mutate: deleteGroup, isPending: isDeleting } =
    useDeleteGroup(groupId);

  const { register, handleSubmit, reset } = useForm({
    resolver: zodResolver(updateGroupSchema),
    defaultValues: {
      name: initialData.name,
      description: initialData.description || "",
    },
  });

  // Reset form when modal opens with fresh data
  useEffect(() => {
    if (isOpen) {
      reset({
        name: initialData.name,
        description: initialData.description || "",
      });
    }
  }, [isOpen, initialData, reset]);

  const onSubmit = (data: any) => {
    updateGroup(data, { onSuccess: onClose });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Group Settings</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Group Name</Label>
              <Input {...register("name")} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input {...register("description")} />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isUpdating}>
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>

        <div className="border-t pt-4 mt-2">
          <div className="rounded-lg bg-red-50 p-4 border border-red-100">
            <div className="flex items-center gap-2 text-red-600 font-semibold mb-1">
              <AlertTriangle className="h-4 w-4" /> Danger Zone
            </div>
            <p className="text-xs text-red-600/80 mb-3">
              Deleting this group will remove all expenses and settlement
              history permanently.
            </p>
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => deleteGroup()}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Group"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
