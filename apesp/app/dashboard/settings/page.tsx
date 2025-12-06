"use client";

import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { Label } from "@/src/components/ui/label";
import { useAuthStore } from "@/src/features/auth/store";
import { useToastStore } from "@/src/hooks/use-toast";
import { api } from "@/src/lib/api";
import { useMutation } from "@tanstack/react-query";

import { useForm } from "react-hook-form";

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore();
  const { addToast } = useToastStore();

  const { register, handleSubmit } = useForm({
    defaultValues: {
      name: user?.name,
      currency: user?.currency,
      timezone: user?.timezone,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      // Integration: PATCH /api/users/me [cite: 113]
      const { data: res } = await api.patch("api/users/me", data);
      return res.data;
    },
    onSuccess: (updatedUser) => {
      updateUser(updatedUser);
      addToast("Profile updated successfully", "success");
    },
    onError: () => addToast("Failed to update profile", "error"),
  });

  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Settings</h1>

      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-xl font-semibold mb-4">Profile</h2>
        <form
          onSubmit={handleSubmit((data) => mutation.mutate(data))}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label>Display Name</Label>
            <Input {...register("name")} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Default Currency</Label>
              <Input {...register("currency")} placeholder="INR" />
            </div>
            <div className="space-y-2">
              <Label>Timezone</Label>
              <Input {...register("timezone")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user?.email} disabled className="bg-muted" />
            <p className="text-xs text-muted-foreground">
              Email cannot be changed directly.
            </p>
          </div>

          <div className="pt-4">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-xl font-semibold mb-4 text-destructive">
          Danger Zone
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Deleting your account will remove all your data and cannot be undone.
        </p>
        <Button variant="destructive">Delete Account</Button>
      </div>
    </div>
  );
}
