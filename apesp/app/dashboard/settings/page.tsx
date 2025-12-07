"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Trash2 } from "lucide-react";

import { useAuthStore } from "@/src/features/auth/store";
import { useUpdateProfile } from "@/src/features/settings/api/settings-queries";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { Label } from "@/src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/Select";

// Form Schema
const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email().optional(), // Read-only usually
  currency: z.string().optional(),
  timezone: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function SettingsPage() {
  const user = useAuthStore((state) => state.user);
  const { mutate: updateProfile, isPending } = useUpdateProfile();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      email: "",
      currency: "INR",
      timezone: "UTC",
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, dirtyFields, isDirty },
  } = form;

  // 1. Initialize Form with User Data
  useEffect(() => {
    if (user) {
      reset({
        name: user.name || "",
        email: user.email || "",
        currency: user.currency || "INR",
        timezone: user.timezone || "UTC",
      });
    }
  }, [user, reset]);

  // 2. Submit Handler - Filters for DIRTY fields only
  const onSubmit = (data: ProfileFormValues) => {
    // Construct payload based strictly on what changed
    const payload: Record<string, any> = {};

    if (dirtyFields.name) payload.name = data.name;
    if (dirtyFields.currency) payload.currency = data.currency;
    if (dirtyFields.timezone) payload.timezone = data.timezone;

    // Prevent empty API calls
    if (Object.keys(payload).length === 0) return;

    updateProfile(payload);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Settings
        </h1>
        <p className="text-slate-500">Manage your profile and preferences.</p>
      </div>

      {/* Profile Section */}
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800 mb-6">Profile</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label>Display Name</Label>
            <Input
              {...register("name")}
              className="h-12 rounded-xl bg-slate-50 focus:bg-white transition-colors"
            />
            {errors.name && (
              <p className="text-red-500 text-xs">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Default Currency</Label>
              <Select
                onValueChange={(val) =>
                  setValue("currency", val, { shouldDirty: true })
                }
                value={form.watch("currency")}
              >
                <SelectTrigger className="h-12 rounded-xl bg-slate-50 focus:bg-white transition-colors">
                  <SelectValue placeholder="Select Currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INR">INR (₹)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Timezone</Label>
              <Select
                onValueChange={(val) =>
                  setValue("timezone", val, { shouldDirty: true })
                }
                value={form.watch("timezone")}
              >
                <SelectTrigger className="h-12 rounded-xl bg-slate-50 focus:bg-white transition-colors">
                  <SelectValue placeholder="Select Timezone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="IST">India (IST)</SelectItem>
                  <SelectItem value="PST">Pacific (PST)</SelectItem>
                  <SelectItem value="EST">Eastern (EST)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              {...register("email")}
              disabled
              className="h-12 rounded-xl bg-slate-100 text-slate-500 cursor-not-allowed"
            />
            <p className="text-[10px] text-slate-400">
              Email cannot be changed directly.
            </p>
          </div>

          <div className="pt-4">
            <Button
              type="submit"
              disabled={!isDirty || isPending}
              className="h-11 px-8 rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="rounded-2xl border border-red-100 bg-red-50/30 p-8 shadow-sm">
        <h2 className="text-lg font-semibold text-red-600 mb-2">Danger Zone</h2>
        <p className="text-sm text-slate-500 mb-6">
          Deleting your account will remove all your data and cannot be undone.
        </p>
        <Button
          variant="destructive"
          className="h-11 rounded-xl bg-red-500 hover:bg-red-600"
        >
          <Trash2 className="w-4 h-4 mr-2" /> Delete Account
        </Button>
      </div>
    </div>
  );
}
