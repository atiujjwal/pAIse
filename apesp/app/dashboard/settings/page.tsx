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
  Check,
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
import { PROFILE_AVATARS } from "@/src/lib/mediaUrls";

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
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your profile and preferences.
        </p>
      </div>

      {/* --- SECTION 1: PROFILE --- */}
      <div className="rounded-[2.5rem] border border-border bg-card p-8 shadow-sm">
        <h2 className="text-xl font-bold text-foreground mb-8">
          Profile Details
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Avatar Section */}
          <div className="flex flex-col sm:flex-row gap-8 items-start pb-8 border-b border-border">
            <div className="relative group shrink-0">
              <div
                className={cn(
                  "h-32 w-32 rounded-3xl overflow-hidden flex items-center justify-center border-4 border-background shadow-lg transition-all",
                  !currentAvatar ? "bg-primary/10" : "bg-muted"
                )}
              >
                {currentAvatar ? (
                  <img
                    src={currentAvatar}
                    alt="Avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-4xl font-bold text-primary">
                    {profile?.name?.[0]?.toUpperCase() || "U"}
                  </span>
                )}
              </div>
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className="absolute -bottom-2 -right-2 h-10 w-10 rounded-xl shadow-lg border-2 border-card"
                onClick={() => setIsEditingAvatar(!isEditingAvatar)}
              >
                {isEditingAvatar ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Pencil className="h-4 w-4" />
                )}
              </Button>
            </div>

            <div className="flex-1 w-full space-y-5">
              <div className="space-y-2">
                <Label>Display Name</Label>
                <Input
                  {...register("name")}
                  className="h-12 rounded-xl bg-muted/30 focus:bg-background border-transparent focus:border-primary/50 text-base"
                />
              </div>

              {isEditingAvatar && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 pt-2">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Custom URL
                    </Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <ImageIcon className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
                        <Input
                          {...register("avatar")}
                          placeholder="https://..."
                          className="pl-10 h-12 rounded-xl bg-muted/30 border-transparent focus:bg-background"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          setValue("avatar", "", { shouldDirty: true })
                        }
                        className="h-12 px-4 rounded-xl border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                        title="Remove Avatar"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>

                  {/* Avatar Library Grid */}
                  <div className="space-y-3">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Choose from Library
                    </Label>
                    <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-3">
                      {PROFILE_AVATARS.map((url, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() =>
                            setValue("avatar", url, { shouldDirty: true })
                          }
                          className={cn(
                            "relative aspect-square rounded-2xl overflow-hidden border-2 transition-all duration-200 hover:scale-110 focus:outline-none",
                            currentAvatar === url
                              ? "border-primary ring-2 ring-primary/20 scale-105 shadow-md"
                              : "border-transparent opacity-80 hover:opacity-100"
                          )}
                        >
                          <img
                            src={url}
                            alt={`Avatar ${i + 1}`}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                          {currentAvatar === url && (
                            <div className="absolute inset-0 bg-primary/40 flex items-center justify-center backdrop-blur-[1px]">
                              <div className="bg-white rounded-full p-0.5 shadow-sm">
                                <Check className="h-3 w-3 text-primary" />
                              </div>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
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
                <SelectTrigger className="h-12 rounded-xl bg-muted/30 border-transparent focus:bg-background">
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
                <SelectTrigger className="h-12 rounded-xl bg-muted/30 border-transparent focus:bg-background">
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
                className="h-12 rounded-xl bg-muted/50 text-muted-foreground cursor-not-allowed border-transparent"
              />
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Lock className="h-3 w-3" /> Contact support to change email.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-border">
            <Button
              type="submit"
              disabled={!isDirty || isPending}
              className="h-12 px-8 rounded-xl shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground transition-all hover:scale-105 active:scale-95"
            >
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </div>

      {/* --- SECTION 2: pAIse TAG --- */}
      <div className="rounded-[2.5rem] border border-border bg-card p-8 shadow-sm">
        <div className="mb-8">
          <h2 className="text-xl font-bold text-foreground">Your pAIse Tag</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Share this to quickly connect with friends.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          <div
            ref={qrRef}
            className="p-6 bg-white border border-border rounded-3xl shadow-sm w-fit mx-auto md:mx-0 flex items-center justify-center"
          >
            {profile?.invite_code ? (
              <QRCode value={inviteLink} size={140} />
            ) : (
              <div className="h-36 w-36 flex flex-col items-center justify-center bg-muted/30 rounded-2xl">
                <QrCode className="h-8 w-8 text-muted-foreground/50" />
                <span className="text-xs text-muted-foreground mt-2 font-medium">
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
                      className="h-12 bg-muted/30 font-mono text-xs rounded-xl border-transparent focus:bg-background"
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-12 w-12 rounded-xl border-border hover:bg-muted"
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

                <div className="rounded-2xl bg-destructive/5 p-4 border border-destructive/10 flex items-center justify-between">
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
                  className="h-12 rounded-xl shadow-lg shadow-primary/20"
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
      <div className="rounded-[2.5rem] border border-destructive/20 bg-destructive/5 p-8">
        <h2 className="text-lg font-bold text-destructive mb-2 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" /> Danger Zone
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Deleting your account will permanently remove all your expenses,
          groups, and settlement history.
        </p>
        <Button
          variant="destructive"
          className="h-12 px-6 rounded-xl shadow-sm hover:bg-destructive/90"
        >
          Delete Account
        </Button>
      </div>
    </div>
  );
}
