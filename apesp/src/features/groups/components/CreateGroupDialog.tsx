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
    defaultValues: { name: "", description: "", avatar: "" },
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
      <DialogContent className="sm:max-w-lg rounded-3xl p-8 bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Create Group</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 mt-2">
          <div className="space-y-4">
            <Label>Choose Avatar</Label>
            <div className="grid grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() => setValue("avatar", "")}
                className={cn(
                  "aspect-square rounded-2xl border-2 flex flex-col items-center justify-center transition-all",
                  !selectedAvatar
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-muted/30 text-muted-foreground hover:bg-muted"
                )}
              >
                <ImageIcon className="h-6 w-6 mb-1" />
                <span className="text-[10px] font-bold uppercase">None</span>
              </button>
              {GROUP_AVATARS.map((url, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setValue("avatar", url)}
                  className={cn(
                    "relative aspect-square rounded-2xl overflow-hidden border-2 transition-all",
                    selectedAvatar === url
                      ? "border-primary ring-2 ring-primary/30"
                      : "border-transparent hover:opacity-80"
                  )}
                >
                  <img
                    src={url}
                    alt="Avatar"
                    className="h-full w-full object-cover"
                  />
                  {selectedAvatar === url && (
                    <div className="absolute inset-0 bg-primary/40 flex items-center justify-center">
                      <Check className="h-5 w-5 text-white drop-shadow-md" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label>Group Name</Label>
              <Input
                {...register("name")}
                placeholder="e.g. Summer Trip"
                className="h-12 rounded-xl bg-muted/30"
              />
              {errors.name && (
                <p className="text-destructive text-xs ml-1">
                  {errors.name.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                {...register("description")}
                placeholder="Optional description"
                className="h-12 rounded-xl bg-muted/30"
              />
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
              disabled={isPending}
              className="h-12 px-8 rounded-xl shadow-lg shadow-primary/20"
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{" "}
              Create
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
