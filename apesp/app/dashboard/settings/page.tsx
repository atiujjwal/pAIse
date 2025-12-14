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
  AlertTriangle,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/src/lib/api";
import { useAuthStore } from "@/src/features/auth/store";
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

const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email().optional(),
  currency: z.string().optional(),
  timezone: z.string().optional(),
  avatar: z.string().optional().or(z.literal("")),
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

  const { data: profile } = useQuery({
    queryKey: ["user", "me"],
    queryFn: async () => {
      const { data } = await api.get("/users/me");
      return data.data;
    },
    placeholderData: storedUser,
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

  useEffect(() => {
    if (profile) {
      reset({
        name: profile.name || "",
        email: profile.email || "",
        currency: profile.currency || "INR",
        timezone: profile.timezone || "UTC",
        avatar: profile.avatar || "",
      });
    }
  }, [profile, reset]);

  const { mutate: updateProfile, isPending } = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.patch("/users/me", data);
      return res.data.data;
    },
    onSuccess: (updatedUser) => {
      updateStoreUser(updatedUser);
      queryClient.setQueryData(["user", "me"], updatedUser);
      addToast("Profile updated successfully", "success");
      setIsEditingAvatar(false);
      reset({
        name: updatedUser.name,
        email: updatedUser.email,
        currency: updatedUser.currency,
        timezone: updatedUser.timezone,
        avatar: updatedUser.avatar || "",
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

  const onSubmit = (data: ProfileFormValues) => {
    const payload: Record<string, any> = {};
    if (dirtyFields.name) payload.name = data.name;
    if (dirtyFields.currency) payload.currency = data.currency;
    if (dirtyFields.timezone) payload.timezone = data.timezone;
    if (dirtyFields.avatar)
      payload.avatar = data.avatar === "" ? null : data.avatar;
    if (Object.keys(payload).length === 0) return;
    updateProfile(payload);
  };

  const inviteLink = profile?.invite_code
    ? `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/add?code=${profile.invite_code}`
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
    <div className="max-w-3xl mx-auto space-y-8 pb-20 pt-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your profile and preferences.
        </p>
      </div>

      {/* --- SECTION 1: PROFILE --- */}
      <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
        <h2 className="text-xl font-bold text-foreground mb-8">
          Profile Details
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Avatar Section */}
          <div className="flex flex-col sm:flex-row gap-8 items-start pb-8 border-b border-border">
            <div className="relative group">
              <div
                className={cn(
                  "h-28 w-28 rounded-full overflow-hidden flex items-center justify-center border-4 border-muted/50 bg-muted shadow-sm",
                  !currentAvatar && "bg-muted"
                )}
              >
                {currentAvatar ? (
                  <img
                    src={currentAvatar}
                    alt="Avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-4xl font-bold text-muted-foreground">
                    {profile?.name?.[0]?.toUpperCase() || "U"}
                  </span>
                )}
              </div>
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className="absolute -bottom-1 -right-1 h-9 w-9 rounded-full shadow-md border-2 border-card"
                onClick={() => setIsEditingAvatar(!isEditingAvatar)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1 w-full space-y-4">
              <div className="space-y-2">
                <Label>Display Name</Label>
                <Input
                  {...register("name")}
                  className="h-12 rounded-xl bg-muted/30 focus:bg-background"
                />
              </div>

              {isEditingAvatar && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                  <Label>Avatar URL</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <ImageIcon className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
                      <Input
                        {...register("avatar")}
                        placeholder="https://..."
                        className="pl-10 h-12 rounded-xl"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setValue("avatar", "")}
                      className="h-12 px-4 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Paste a direct image link.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Default Currency</Label>
              <Select
                onValueChange={(val) =>
                  setValue("currency", val, { shouldDirty: true })
                }
                value={form.watch("currency")}
              >
                <SelectTrigger className="h-12 rounded-xl bg-muted/30">
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
                <SelectTrigger className="h-12 rounded-xl bg-muted/30">
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

            <div className="space-y-2 md:col-span-2">
              <Label>Email Address</Label>
              <Input
                {...register("email")}
                disabled
                className="h-12 rounded-xl bg-muted/50 text-muted-foreground cursor-not-allowed"
              />
              <p className="text-[11px] text-muted-foreground">
                Contact support to change email.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              disabled={!isDirty || isPending}
              className="h-12 px-8 rounded-xl shadow-lg shadow-primary/20"
            >
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </div>

      {/* --- SECTION 2: pAIse TAG --- */}
      <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-8">
          <h2 className="text-xl font-bold text-foreground">Your pAIse Tag</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Share this to quickly connect with friends.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          <div
            ref={qrRef}
            className="p-4 bg-white border border-border rounded-2xl shadow-sm w-fit mx-auto md:mx-0"
          >
            {profile?.invite_code ? (
              <QRCode value={inviteLink} size={160} />
            ) : (
              <div className="h-40 w-40 flex flex-col items-center justify-center bg-muted/30 rounded-xl">
                <QrCode className="h-8 w-8 text-muted-foreground/50" />
                <span className="text-xs text-muted-foreground mt-2">
                  No Tag
                </span>
              </div>
            )}
          </div>

          <div className="flex-1 space-y-6">
            {profile?.invite_code ? (
              <>
                <div className="space-y-2">
                  <Label>Share Link</Label>
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value={inviteLink}
                      className="h-12 bg-muted/30 font-mono text-xs rounded-xl"
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-12 w-12 rounded-xl"
                      onClick={copyToClipboard}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-12 w-12 rounded-xl"
                      onClick={downloadQRCode}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="rounded-xl bg-destructive/5 p-4 border border-destructive/10 flex items-center justify-between">
                  <p className="text-xs text-destructive/80 font-medium">
                    Need to invalidate old links?
                  </p>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => rotateCode()}
                    disabled={isRotating}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive h-9 rounded-lg"
                  >
                    {isRotating ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3 w-3 mr-2" />
                    )}
                    Reset Tag
                  </Button>
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col justify-center items-start">
                <p className="text-sm text-muted-foreground mb-4">
                  Generate your unique tag to start sharing.
                </p>
                <Button
                  onClick={() => rotateCode()}
                  disabled={isRotating}
                  className="h-12 rounded-xl"
                >
                  {isRotating && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Generate My Tag
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- SECTION 3: DANGER ZONE --- */}
      <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-8">
        <h2 className="text-lg font-bold text-destructive mb-2 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" /> Danger Zone
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Deleting your account will permanently remove all your expenses,
          groups, and settlement history.
        </p>
        <Button
          variant="destructive"
          className="h-12 px-6 rounded-xl shadow-sm"
        >
          Delete Account
        </Button>
      </div>
    </div>
  );
}
