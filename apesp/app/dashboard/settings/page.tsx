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
  Check,
  AlertTriangle,
  Lock,
  Share2,
  X,
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
    formState: { dirtyFields, isDirty },
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
    <div className="max-w-7xl mx-auto space-y-8 pb-20 pt-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your personal profile and preferences.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* --- LEFT COLUMN: ID CARD (Sticky) --- */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 space-y-6">
            {/* The "ID Card" */}
            <div className="bg-gradient-to-br from-card to-muted/20 rounded-[2.5rem] border border-border shadow-lg p-8 text-center relative overflow-hidden">
              {/* Shine Effect */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

              {/* Avatar Container */}
              <div className="relative mx-auto w-32 h-32 mb-6 group">
                <div
                  className={cn(
                    "w-full h-full rounded-full overflow-hidden border-4 border-background shadow-xl",
                    !currentAvatar &&
                      "bg-primary/10 flex items-center justify-center"
                  )}
                >
                  {currentAvatar ? (
                    <img
                      src={currentAvatar}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-5xl font-bold text-primary">
                      {profile?.name?.[0]?.toUpperCase()}
                    </span>
                  )}
                </div>
                <Button
                  size="icon"
                  className="absolute bottom-0 right-0 h-10 w-10 rounded-full shadow-lg border-2 border-background"
                  onClick={() => setIsEditingAvatar(!isEditingAvatar)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>

              {/* Name & Tag */}
              <h2 className="text-2xl font-extrabold text-foreground mb-1">
                {profile?.name}
              </h2>
              <p className="text-sm text-muted-foreground mb-6 font-medium">
                {profile?.email}
              </p>

              {/* QR Code Section */}
              <div className="bg-white p-4 rounded-3xl shadow-sm border border-border inline-block mb-6">
                {profile?.invite_code ? (
                  <div ref={qrRef}>
                    <QRCode value={inviteLink} size={140} />
                  </div>
                ) : (
                  <div className="h-[140px] w-[140px] flex flex-col items-center justify-center bg-slate-50 rounded-xl">
                    <QrCode className="h-8 w-8 text-slate-300 mb-2" />
                    <span className="text-xs text-slate-400 font-medium">
                      No Tag Generated
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              {profile?.invite_code ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      className="rounded-xl h-11 border-border bg-background/50 hover:bg-background"
                      onClick={copyToClipboard}
                    >
                      <Copy className="h-4 w-4 mr-2" /> Copy Link
                    </Button>
                    <Button
                      variant="outline"
                      className="rounded-xl h-11 border-border bg-background/50 hover:bg-background"
                      onClick={downloadQRCode}
                    >
                      <Download className="h-4 w-4 mr-2" /> Save QR
                    </Button>
                  </div>

                  {/* Reset Button Positioned Here */}
                  <Button
                    variant="ghost"
                    onClick={() => rotateCode()}
                    disabled={isRotating}
                    className="w-full text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl h-9"
                  >
                    {isRotating ? (
                      <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3 w-3 mr-2" />
                    )}
                    Reset Tag Link
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => rotateCode()}
                  disabled={isRotating}
                  className="w-full mt-4 rounded-xl h-12 shadow-lg shadow-primary/20"
                >
                  {isRotating && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Generate pAIse Tag
                </Button>
              )}
            </div>

            {/* Helper Text */}
            <div className="bg-primary/5 border border-primary/10 rounded-3xl p-5 flex items-start gap-3">
              <Share2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <h4 className="font-bold text-sm text-primary mb-1">
                  pAIse Tag
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  This QR code is your unique digital card. Friends can scan it
                  to instantly add you and start splitting bills.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* --- RIGHT COLUMN: EDIT FORM --- */}
        <div className="lg:col-span-2 space-y-8">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="bg-card rounded-[2.5rem] border border-border shadow-sm p-8 md:p-10 space-y-8"
          >
            <div className="flex items-center justify-between border-b border-border pb-6">
              <div>
                <h3 className="text-xl font-bold text-foreground">
                  Edit Profile
                </h3>
                <p className="text-muted-foreground text-sm">
                  Update your personal details here.
                </p>
              </div>
              <Button
                type="submit"
                disabled={!isDirty || isPending}
                className="rounded-xl h-11 px-6 shadow-md transition-all hover:scale-105 active:scale-95"
              >
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{" "}
                Save Changes
              </Button>
            </div>

            {/* AVATAR EDIT DRAWER (Expandable) */}
            {isEditingAvatar && (
              <div className="bg-muted/30 rounded-3xl p-6 border border-border animate-in fade-in slide-in-from-top-4">
                <div className="flex justify-between items-center mb-4">
                  <Label className="text-base font-bold">Choose Avatar</Label>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsEditingAvatar(false)}
                    className="h-8 w-8 p-0 rounded-full"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                </div>

                {/* Custom URL Input */}
                <div className="flex gap-2 mb-6">
                  <div className="relative flex-1">
                    <ImageIcon className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
                    <Input
                      {...register("avatar")}
                      placeholder="Paste an image URL..."
                      className="pl-10 h-12 rounded-xl bg-background border-border"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setValue("avatar", "", { shouldDirty: true })
                    }
                    className="h-12 w-12 rounded-xl border-border"
                  >
                    <Trash2 className="h-5 w-5 text-destructive" />
                  </Button>
                </div>

                {/* Avatar Library */}
                <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-7 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {PROFILE_AVATARS.map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() =>
                        setValue("avatar", url, { shouldDirty: true })
                      }
                      className={cn(
                        "relative aspect-square rounded-2xl overflow-hidden border-2 transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary",
                        currentAvatar === url
                          ? "border-primary ring-2 ring-primary/20 shadow-md scale-105"
                          : "border-transparent opacity-80 hover:opacity-100"
                      )}
                    >
                      <img
                        src={url}
                        alt="Avatar option"
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {currentAvatar === url && (
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
            )}

            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input
                    {...register("name")}
                    className="h-12 rounded-xl bg-muted/30 border-transparent focus:bg-background focus:border-primary/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <div className="relative">
                    <Input
                      {...register("email")}
                      disabled
                      className="h-12 rounded-xl bg-muted/50 text-muted-foreground border-transparent pr-10"
                    />
                    <Lock className="absolute right-3 top-3.5 h-5 w-5 text-muted-foreground/50" />
                  </div>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select
                    onValueChange={(val) =>
                      setValue("currency", val, { shouldDirty: true })
                    }
                    value={form.watch("currency")}
                  >
                    <SelectTrigger className="h-12 rounded-xl bg-muted/30 border-transparent focus:bg-background">
                      <SelectValue />
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
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC (Universal)</SelectItem>
                      <SelectItem value="IST">IST (India)</SelectItem>
                      <SelectItem value="PST">PST (Pacific)</SelectItem>
                      <SelectItem value="EST">EST (Eastern)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </form>

          {/* DANGER ZONE */}
          <div className="rounded-[2.5rem] border border-destructive/20 bg-destructive/5 p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h3 className="font-bold text-lg text-destructive flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" /> Danger Zone
              </h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                Deleting your account is permanent. All expenses and history
                will be wiped.
              </p>
            </div>
            <Button
              variant="destructive"
              className="h-12 px-6 rounded-xl shadow-sm hover:bg-destructive/90"
            >
              Delete Account
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
