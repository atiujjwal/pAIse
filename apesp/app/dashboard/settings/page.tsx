"use client";

import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import QRCode from "react-qr-code";
import {
  Loader2,
  Trash2,
  Copy,
  RefreshCw,
  QrCode,
  Download,
  Image as ImageIcon,
  Pencil,
  X,
  Lock,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/src/lib/api";
import { useAuthStore } from "@/src/features/auth/store";
import { useUpdateProfile } from "@/src/features/settings/api/settings-queries";
import { useToastStore } from "@/src/hooks/use-toast";
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
import { cn } from "@/src/lib/utils";

// Schema
const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email().optional(),
  currency: z.string().optional(),
  timezone: z.string().optional(),
  avatar: z
    .string()
    .url("Please enter a valid image URL")
    .optional()
    .or(z.literal("")),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function SettingsPage() {
  const { user: storedUser, updateUser: updateStoreUser } = useAuthStore(
    (state) => state
  );
  const { addToast } = useToastStore();
  const queryClient = useQueryClient();
  const qrRef = useRef<HTMLDivElement>(null);

  const [isEditingAvatar, setIsEditingAvatar] = useState(false);

  // 1. FETCH LATEST PROFILE DATA (Fixes missing/stale data issue)
  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ["user", "me"],
    queryFn: async () => {
      const { data } = await api.get("/users/me");
      return data.data; // Expecting full user object
    },
    // If we have a stored user, use it as placeholder data to avoid layout shift
    placeholderData: storedUser,
  });

  // --- Mutations ---
  const { mutate: updateProfile, isPending } = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.patch("/users/me", data);
      return res.data.data;
    },
    onSuccess: (updatedUser) => {
      // Sync Global Store & React Query Cache
      updateStoreUser(updatedUser);
      queryClient.setQueryData(["user", "me"], updatedUser);

      addToast("Profile updated successfully", "success");
      setIsEditingAvatar(false);

      // Reset form to clean state
      reset({
        name: updatedUser.name,
        email: updatedUser.email,
        currency: updatedUser.currency || "INR",
        timezone: updatedUser.timezone || "UTC",
        avatar: updatedUser.avatar_url || updatedUser.avatar || "",
      });
    },
    onError: (err: any) => {
      addToast(
        err?.response?.data?.message || "Failed to update profile",
        "error"
      );
    },
  });

  const { mutate: rotateCode, isPending: isRotating } = useMutation({
    mutationFn: async () => {
      const { data } = await api.patch("/users/me/code");
      return data.data;
    },
    onSuccess: (data) => {
      if (profile) {
        const updated = { ...profile, invite_code: data.invite_code };
        updateStoreUser(updated);
        queryClient.setQueryData(["user", "me"], updated);
      }
      addToast("pAIse Tag generated successfully", "success");
    },
    onError: () => addToast("Failed to generate tag", "error"),
  });

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      email: "",
      currency: "INR",
      timezone: "UTC",
      avatar: "",
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, dirtyFields, isDirty },
  } = form;

  const currentAvatar = watch("avatar");

  // 2. INITIALIZE FORM WITH FETCHED DATA
  useEffect(() => {
    if (profile) {
      reset({
        name: profile.name || "",
        email: profile.email || "",
        currency: profile.currency || "INR",
        timezone: profile.timezone || "UTC",
        // Handle both casing possibilities just in case
        avatar: profile.avatar_url || profile.avatar || "",
      });
    }
  }, [profile, reset]);

  const onSubmit = (data: ProfileFormValues) => {
    const payload: Record<string, any> = {};

    if (dirtyFields.name) payload.name = data.name;
    if (dirtyFields.currency) payload.currency = data.currency;
    if (dirtyFields.timezone) payload.timezone = data.timezone;
    if (dirtyFields.avatar) {
      payload.avatar = data.avatar === "" ? null : data.avatar;
    }

    if (Object.keys(payload).length === 0) return;
    updateProfile(payload);
  };

  const handleCancelAvatarEdit = () => {
    // Revert to the fetched profile URL
    setValue("avatar", profile?.avatar_url || profile?.avatar || "");
    setIsEditingAvatar(false);
  };

  const handleRemoveAvatar = () => {
    setValue("avatar", "", { shouldDirty: true });
    setIsEditingAvatar(true);
  };

  const inviteLink = profile?.invite_code
    ? `https://paise.app/add?code=${profile.invite_code}`
    : "";

  const copyToClipboard = () => {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink);
    addToast("Link copied to clipboard", "success");
  };

  const downloadQRCode = () => {
    if (!qrRef.current) return;
    const svg = qrRef.current.querySelector("svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = `paise-tag-${profile?.name}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      }
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Settings
        </h1>
        <p className="text-slate-500">Manage your profile and preferences.</p>
      </div>

      {/* --- SECTION 1: PROFILE --- */}
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800 mb-6">Profile</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Avatar Section */}
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center pb-6 border-b border-slate-100">
            {/* Image Preview */}
            <div className="relative h-20 w-20 flex-shrink-0">
              <div
                className={cn(
                  "h-20 w-20 rounded-full overflow-hidden flex items-center justify-center border-2 border-slate-100 bg-slate-50 shadow-sm",
                  !currentAvatar && "bg-slate-100"
                )}
              >
                {currentAvatar ? (
                  <img
                    src={currentAvatar}
                    alt="Avatar Preview"
                    className="h-full w-full object-cover"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                ) : (
                  <span className="text-2xl font-bold text-slate-300">
                    {profile?.name?.[0]?.toUpperCase() || "U"}
                  </span>
                )}
              </div>
            </div>

            {/* Avatar Inputs */}
            <div className="flex-1 w-full space-y-3">
              <Label>Profile Picture</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <ImageIcon className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                  <Input
                    {...register("avatar")}
                    disabled={!isEditingAvatar} // LOCKED by default
                    placeholder="https://example.com/my-photo.jpg"
                    className={cn(
                      "pl-9 h-11 bg-slate-50 border-slate-200 transition-colors focus:bg-white",
                      !isEditingAvatar &&
                        "text-slate-500 bg-slate-100 cursor-not-allowed"
                    )}
                  />
                </div>

                {/* Toggle Buttons */}
                {!isEditingAvatar ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditingAvatar(true)}
                    className="h-11 border-slate-200"
                    title="Edit Avatar URL"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancelAvatarEdit}
                      className="h-11 border-slate-200 text-slate-500 hover:text-slate-700"
                      title="Cancel Edit"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    {currentAvatar && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleRemoveAvatar}
                        className="h-11 border-slate-200 text-red-500 hover:text-red-600 hover:bg-red-50"
                        title="Remove Avatar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </>
                )}
              </div>

              {errors.avatar && (
                <p className="text-red-500 text-xs">{errors.avatar.message}</p>
              )}

              <p className="text-[10px] text-slate-400 flex items-center gap-1">
                {!isEditingAvatar && <Lock className="h-3 w-3" />}
                {isEditingAvatar
                  ? "Paste a direct link to an image (JPG, PNG). Clear to remove."
                  : "Field is locked to prevent accidental changes."}
              </p>
            </div>
          </div>

          {/* Other Fields */}
          <div className="space-y-6">
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
          </div>

          <div className="pt-2">
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

      {/* --- SECTION 2: pAIse TAG (QR Code) --- */}
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              Your pAIse Tag
            </h2>
            <p className="text-sm text-slate-500">
              Share this code to quickly connect with friends.
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-8">
          <div
            ref={qrRef}
            className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm flex-shrink-0 min-h-[160px] min-w-[160px] flex items-center justify-center relative group"
          >
            {profile?.invite_code ? (
              <>
                <QRCode
                  value={inviteLink}
                  size={160}
                  style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                />
                <div className="absolute inset-0 bg-black/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none group-hover:pointer-events-auto">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={downloadQRCode}
                    className="shadow-lg"
                  >
                    <Download className="w-4 h-4 mr-2" /> Save
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <QrCode className="h-8 w-8 text-slate-300" />
                <p className="text-[10px] text-slate-400">No tag generated</p>
              </div>
            )}
          </div>

          <div className="flex-1 w-full space-y-4">
            {profile?.invite_code ? (
              <>
                <div className="space-y-2">
                  <Label>Share Link</Label>
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value={inviteLink}
                      className="bg-slate-50 font-mono text-xs text-slate-600 h-11"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-11 w-11 shrink-0 border-slate-200"
                      onClick={copyToClipboard}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <p className="text-xs text-slate-400">
                    Code leaked? Reset it to invalidate old links.
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 h-9"
                    onClick={() => rotateCode()}
                    disabled={isRotating}
                  >
                    {isRotating ? (
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 h-3.5 w-3.5" />
                    )}
                    Reset Link
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-start gap-3">
                <p className="text-sm text-slate-600">
                  You haven't generated your unique pAIse Tag yet. Generate one
                  to start sharing!
                </p>
                <Button
                  onClick={() => rotateCode()}
                  disabled={isRotating}
                  className="bg-primary"
                >
                  {isRotating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Generate My Tag
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- SECTION 3: DANGER ZONE --- */}
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
