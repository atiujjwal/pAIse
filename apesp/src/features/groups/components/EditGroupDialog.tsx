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

// Same list for consistency
const AVATAR_OPTIONS = [
  "https://res.cloudinary.com/do1f9qqik/image/upload/v1753296580/samples/smile.jpg",
  "https://res.cloudinary.com/do1f9qqik/image/upload/v1753296573/samples/people/boy-snow-hoodie.jpg",
  "https://res.cloudinary.com/do1f9qqik/image/upload/v1753296572/samples/people/smiling-man.jpg",
  "https://res.cloudinary.com/do1f9qqik/image/upload/v1753296571/samples/animals/cat.jpg",
  "https://res.cloudinary.com/do1f9qqik/image/upload/v1753296570/sample.jpg",
  "https://res.cloudinary.com/do1f9qqik/image/upload/v1753296572/samples/food/pot-mussels.jpg",
  "https://res.cloudinary.com/do1f9qqik/image/upload/v1753296582/samples/dessert-on-a-plate.jpg",
];

const updateGroupSchema = z.object({
  name: z.string().min(1, "Group name is required"),
  description: z.string().optional(),
  avatar: z.string().optional().nullable(),
});

interface EditGroupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  // UPDATED: Added avatar to interface
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

  // Reset form when modal opens with fresh data
  useEffect(() => {
    if (isOpen) {
      reset({
        name: initialData.name,
        description: initialData.description || "",
        avatar: initialData.avatar || "",
      });
      setShowAvatarGrid(false); // Reset UI state
    }
  }, [isOpen, initialData, reset]);

  const onSubmit = (data: any) => {
    updateGroup(data, { onSuccess: onClose });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Group Settings</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Avatar Preview Section */}
          <div className="flex flex-col items-center gap-4 py-2">
            <div className="relative group">
              <div
                className={cn(
                  "h-24 w-24 rounded-2xl overflow-hidden border-2 border-slate-100 shadow-sm flex items-center justify-center bg-slate-50 transition-all",
                  !currentAvatar && "bg-slate-100"
                )}
              >
                {currentAvatar ? (
                  <img
                    src={currentAvatar}
                    alt="Group Avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <ImageIcon className="h-8 w-8 text-slate-300" />
                )}
              </div>

              {/* Edit Pencil Button */}
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full shadow-md border border-white hover:bg-slate-100"
                onClick={() => setShowAvatarGrid(!showAvatarGrid)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Conditional Avatar Grid */}
            {showAvatarGrid && (
              <div className="w-full space-y-3 animate-in fade-in slide-in-from-top-2 duration-200 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="flex justify-between items-center">
                  <Label className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                    Select Avatar
                  </Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAvatarGrid(false)}
                    className="h-6 text-[10px] text-slate-400"
                  >
                    Close
                  </Button>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {/* Remove Option */}
                  <button
                    type="button"
                    onClick={() => setValue("avatar", "")}
                    className={cn(
                      "aspect-square rounded-lg border flex items-center justify-center transition-all hover:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20",
                      !currentAvatar
                        ? "border-primary bg-white text-primary"
                        : "border-transparent text-slate-400"
                    )}
                    title="Remove Avatar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>

                  {/* Image Options */}
                  {AVATAR_OPTIONS.map((url, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setValue("avatar", url)}
                      className={cn(
                        "relative aspect-square rounded-lg overflow-hidden border transition-all focus:outline-none focus:ring-2 focus:ring-primary/20",
                        currentAvatar === url
                          ? "border-primary ring-2 ring-primary ring-offset-1"
                          : "border-transparent opacity-70 hover:opacity-100"
                      )}
                    >
                      <img
                        src={url}
                        alt={`Option ${index}`}
                        className="h-full w-full object-cover"
                      />
                      {currentAvatar === url && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
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
              <Input {...register("name")} className="h-11" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input {...register("description")} className="h-11" />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="h-11"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isUpdating}
              className="h-11 min-w-[120px]"
            >
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
              className="w-full h-10"
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
