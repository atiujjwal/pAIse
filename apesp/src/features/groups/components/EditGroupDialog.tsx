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
  name: z.string().min(1, "Group name is required"),
  description: z.string().optional(),
  avatar: z.string().optional().nullable(),
});

interface EditGroupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  initialData: {
    name: string;
    description?: string;
    avatar?: string | null;
  };
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
      name: initialData.name,
      description: initialData.description || "",
      avatar: initialData.avatar || "",
    },
  });

  const currentAvatar = watch("avatar");

  useEffect(() => {
    if (isOpen) {
      reset({
        name: initialData.name,
        description: initialData.description || "",
        avatar: initialData.avatar || "",
      });
      setShowAvatarGrid(false);
    }
  }, [isOpen, initialData, reset]);

  const onSubmit = (data: any) => {
    updateGroup(data, { onSuccess: onClose });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-3xl p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Group Settings</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Avatar Preview Section */}
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="relative group">
              <div
                className={cn(
                  "h-28 w-28 rounded-3xl overflow-hidden border-4 border-card shadow-lg flex items-center justify-center bg-muted transition-all",
                  !currentAvatar && "bg-muted text-muted-foreground"
                )}
              >
                {currentAvatar ? (
                  <img
                    src={currentAvatar}
                    alt="Group Avatar"
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
                className="absolute -bottom-2 -right-2 h-10 w-10 rounded-full shadow-lg border-2 border-card hover:scale-110 transition-transform"
                onClick={() => setShowAvatarGrid(!showAvatarGrid)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </div>

            {/* Conditional Avatar Grid */}
            {showAvatarGrid && (
              <div className="w-full space-y-3 animate-in fade-in slide-in-from-top-2 duration-200 bg-muted/30 p-4 rounded-2xl border border-border">
                <div className="flex justify-between items-center">
                  <Label className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
                    Select Avatar
                  </Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAvatarGrid(false)}
                    className="h-6 text-[10px] text-muted-foreground"
                  >
                    Close
                  </Button>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setValue("avatar", "")}
                    className={cn(
                      "aspect-square rounded-xl border-2 flex items-center justify-center transition-all",
                      !currentAvatar
                        ? "border-primary bg-background text-primary"
                        : "border-transparent bg-background/50 text-muted-foreground hover:bg-background"
                    )}
                    title="Remove Avatar"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>

                  {GROUP_AVATARS.map((url, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setValue("avatar", url)}
                      className={cn(
                        "relative aspect-square rounded-xl overflow-hidden border-2 transition-all",
                        currentAvatar === url
                          ? "border-primary ring-2 ring-primary ring-offset-1"
                          : "border-transparent opacity-80 hover:opacity-100"
                      )}
                    >
                      <img
                        src={url}
                        alt={`Option ${index}`}
                        className="h-full w-full object-cover"
                      />
                      {currentAvatar === url && (
                        <div className="absolute inset-0 bg-primary/30 flex items-center justify-center">
                          <Check className="h-4 w-4 text-white drop-shadow-md" />
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
              <Label>Group Name</Label>
              <Input {...register("name")} className="h-12 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input {...register("description")} className="h-12 rounded-xl" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="h-12 px-6 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isUpdating}
              className="h-12 px-6 rounded-xl min-w-[140px]"
            >
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>

        <div className="border-t border-border pt-6 mt-4">
          <div className="rounded-2xl bg-destructive/5 p-5 border border-destructive/10">
            <div className="flex items-center gap-2 text-destructive font-bold mb-1">
              <AlertTriangle className="h-4 w-4" /> Danger Zone
            </div>
            <p className="text-xs text-destructive/80 mb-4 font-medium leading-relaxed">
              Deleting this group will remove all expenses and settlement
              history permanently.
            </p>
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
