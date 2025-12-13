"use client";

import { useEffect, useState } from "react";
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
import {
  Loader2,
  Trash2,
  AlertTriangle,
  Pencil,
  Image as ImageIcon,
  Check,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { GROUP_AVATARS } from "@/src/lib/mediaUrls";

const updateGroupSchema = z.object({
  name: z.string().min(1, "Required"),
  description: z.string().optional(),
  avatar: z.string().optional().nullable(),
});

interface EditGroupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  initialData: { name: string; description?: string; avatar?: string | null };
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
  const [showAvatarGrid, setShowAvatarGrid] = useState(false);

  const { register, handleSubmit, reset, setValue, watch } = useForm({
    resolver: zodResolver(updateGroupSchema),
    defaultValues: {
      ...initialData,
      description: initialData.description || "",
      avatar: initialData.avatar || "",
    },
  });

  const currentAvatar = watch("avatar");

  useEffect(() => {
    if (isOpen) {
      reset({
        ...initialData,
        description: initialData.description || "",
        avatar: initialData.avatar || "",
      });
      setShowAvatarGrid(false);
    }
  }, [isOpen, initialData, reset]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-3xl p-6 bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Group Settings</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit((data) =>
            updateGroup(data, { onSuccess: onClose })
          )}
          className="space-y-6"
        >
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="relative group">
              <div className="h-28 w-28 rounded-3xl overflow-hidden border-4 border-card shadow-lg bg-muted flex items-center justify-center">
                {currentAvatar ? (
                  <img
                    src={currentAvatar}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <ImageIcon className="h-10 w-10 opacity-50" />
                )}
              </div>
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className="absolute -bottom-2 -right-2 rounded-full shadow-lg"
                onClick={() => setShowAvatarGrid(!showAvatarGrid)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </div>

            {showAvatarGrid && (
              <div className="w-full bg-muted/30 p-4 rounded-2xl border border-border animate-in fade-in slide-in-from-top-2">
                <div className="grid grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setValue("avatar", "")}
                    className="aspect-square rounded-xl border-2 border-border flex items-center justify-center hover:bg-muted"
                  >
                    <Trash2 className="h-5 w-5 text-muted-foreground" />
                  </button>
                  {GROUP_AVATARS.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setValue("avatar", url)}
                      className={cn(
                        "aspect-square rounded-xl overflow-hidden border-2 relative",
                        currentAvatar === url
                          ? "border-primary"
                          : "border-transparent"
                      )}
                    >
                      <img src={url} className="h-full w-full object-cover" />
                      {currentAvatar === url && (
                        <div className="absolute inset-0 bg-primary/30 flex items-center justify-center">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input {...register("name")} className="h-12 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input {...register("description")} className="h-12 rounded-xl" />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="h-12 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isUpdating}
              className="h-12 rounded-xl shadow-lg"
            >
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{" "}
              Save
            </Button>
          </div>
        </form>

        <div className="border-t border-border pt-6 mt-2">
          <div className="rounded-2xl bg-destructive/5 p-5 border border-destructive/10">
            <div className="flex items-center gap-2 text-destructive font-bold mb-2">
              <AlertTriangle className="h-4 w-4" /> Danger Zone
            </div>
            <Button
              variant="destructive"
              className="w-full h-11 rounded-xl shadow-sm"
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
