"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2, Image as ImageIcon, Check } from "lucide-react";

import { useCreateGroup } from "@/src/features/groups/api/group-details-query";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { Label } from "@/src/components/ui/label";
import { cn } from "@/src/lib/utils";
import { GROUP_AVATARS } from "@/src/lib/mediaUrls";

const createGroupSchema = z.object({
  name: z.string().min(1, "Group name is required"),
  description: z.string().optional(),
  avatar: z.string().optional(),
});

type CreateGroupFormValues = z.infer<typeof createGroupSchema>;

export default function CreateGroupPage() {
  const router = useRouter();
  const { mutate: createGroup, isPending } = useCreateGroup();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
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
        router.push("/dashboard/groups");
      },
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-20 pt-6">
      {/* --- Navigation --- */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="text-muted-foreground hover:text-foreground -ml-2 rounded-xl"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Groups
        </Button>
      </div>

      {/* --- Main Card --- */}
      <div className="bg-card rounded-[2.5rem] border border-border shadow-sm p-8 md:p-10 relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header */}
        <div className="mb-8 border-b border-border pb-6">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Create New Group
          </h1>
          <p className="text-muted-foreground mt-2">
            Start a new collection for a trip, home, or event.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Avatar Selection */}
          <div className="space-y-4">
            <Label className="text-base font-semibold text-foreground">
              Group Avatar
            </Label>
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
              {/* No Avatar Option */}
              <button
                type="button"
                onClick={() => setValue("avatar", "")}
                className={cn(
                  "aspect-square rounded-2xl border-2 flex flex-col items-center justify-center transition-all duration-200",
                  !selectedAvatar
                    ? "border-primary bg-primary/10 text-primary shadow-sm"
                    : "border-border bg-muted/30 text-muted-foreground hover:bg-muted"
                )}
              >
                <ImageIcon className="h-6 w-6 mb-1" />
                <span className="text-[10px] font-bold uppercase tracking-wide">
                  None
                </span>
              </button>

              {/* Image Options */}
              {GROUP_AVATARS.map((url, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setValue("avatar", url)}
                  className={cn(
                    "relative aspect-square rounded-2xl overflow-hidden border-2 transition-all duration-200",
                    selectedAvatar === url
                      ? "border-primary ring-4 ring-primary/10 scale-105 shadow-md"
                      : "border-transparent opacity-80 hover:opacity-100 hover:scale-105"
                  )}
                >
                  <img
                    src={url}
                    alt={`Avatar ${index}`}
                    className="h-full w-full object-cover"
                  />
                  {selectedAvatar === url && (
                    <div className="absolute inset-0 bg-primary/40 flex items-center justify-center backdrop-blur-[1px]">
                      <div className="bg-white rounded-full p-1 shadow-sm">
                        <Check className="h-3 w-3 text-primary" />
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Text Inputs */}
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-foreground">Group Name</Label>
              <Input
                {...register("name")}
                placeholder="e.g. Summer Trip 2025"
                className="h-12 rounded-xl bg-muted/30 border-transparent focus:bg-background focus:border-primary/50 text-lg"
              />
              {errors.name && (
                <p className="text-destructive text-xs font-medium ml-1">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">
                Description{" "}
                <span className="text-muted-foreground font-normal">
                  (Optional)
                </span>
              </Label>
              <Input
                {...register("description")}
                placeholder="What is this group for?"
                className="h-12 rounded-xl bg-muted/30 border-transparent focus:bg-background focus:border-primary/50"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
              className="flex-1 h-12 rounded-xl text-muted-foreground hover:bg-muted"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="flex-[2] h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:scale-[1.02] transition-all"
            >
              {isPending ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                "Create Group"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
