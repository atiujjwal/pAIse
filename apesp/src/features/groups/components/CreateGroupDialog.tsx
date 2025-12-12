"use client";

import { z } from "zod";
import { Loader2, Image as ImageIcon, Check } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateGroup } from "../api/group-details-query";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { Label } from "@/src/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/Dialog";
import { cn } from "@/src/lib/utils";
import { GROUP_AVATARS } from "@/src/lib/mediaUrls";


const createGroupSchema = z.object({
  name: z.string().min(1, "Group name is required"),
  description: z.string().optional(),
  avatar: z.string().optional(),
});

type CreateGroupFormValues = z.infer<typeof createGroupSchema>;

export function CreateGroupDialog({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { mutate: createGroup, isPending } = useCreateGroup();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateGroupFormValues>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      name: "",
      description: "",
      avatar: "",
    },
  });

  const selectedAvatar = watch("avatar");

  const onSubmit = (data: CreateGroupFormValues) => {
    createGroup(data, {
      onSuccess: () => {
        reset();
        onClose();
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Group</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-2">
          {/* Avatar Selection */}
          <div className="space-y-3">
            <Label className="text-sm text-slate-600">
              Choose Group Avatar
            </Label>
            <div className="grid grid-cols-4 gap-3">
              {/* No Avatar Option */}
              <button
                type="button"
                onClick={() => setValue("avatar", "")}
                className={cn(
                  "aspect-square rounded-xl border-2 flex flex-col items-center justify-center transition-all hover:bg-slate-50",
                  !selectedAvatar
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-slate-200 text-slate-400"
                )}
              >
                <ImageIcon className="h-6 w-6 mb-1" />
                <span className="text-[10px] font-medium">None</span>
              </button>

              {/* Image Options */}
              {GROUP_AVATARS.map((url, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setValue("avatar", url)}
                  className={cn(
                    "relative aspect-square rounded-xl overflow-hidden border-2 transition-all",
                    selectedAvatar === url
                      ? "border-primary ring-2 ring-primary ring-offset-2"
                      : "border-transparent hover:opacity-80"
                  )}
                >
                  <img
                    src={url}
                    alt={`Avatar ${index}`}
                    className="h-full w-full object-cover"
                  />
                  {selectedAvatar === url && (
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <div className="bg-primary rounded-full p-1">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Group Name</Label>
              <Input
                {...register("name")}
                placeholder="e.g. Summer Trip"
                className="h-11"
              />
              {errors.name && (
                <p className="text-red-500 text-xs">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Description (Optional)</Label>
              <Input
                {...register("description")}
                placeholder="What's this group for?"
                className="h-11"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
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
              disabled={isPending}
              className="h-11 shadow-lg shadow-primary/20"
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Group
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
