"use client";

import { useEffect, useRef } from "react";
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
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";

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

// Form Schema
const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email().optional(),
  currency: z.string().optional(),
  timezone: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function SettingsPage() {
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const { addToast } = useToastStore();
  const qrRef = useRef<HTMLDivElement>(null);

  const { mutate: updateProfile, isPending } = useUpdateProfile();

  // --- Invite Code Mutation ---
  const { mutate: rotateCode, isPending: isRotating } = useMutation({
    mutationFn: async () => {
      const { data } = await api.patch("/users/me/code");
      return data.data;
    },
    onSuccess: (data) => {
      if (user) updateUser({ ...user, invite_code: data.invite_code });
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
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, dirtyFields, isDirty },
  } = form;

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

  const onSubmit = (data: ProfileFormValues) => {
    const payload: Record<string, any> = {};
    if (dirtyFields.name) payload.name = data.name;
    if (dirtyFields.currency) payload.currency = data.currency;
    if (dirtyFields.timezone) payload.timezone = data.timezone;

    if (Object.keys(payload).length === 0) return;
    updateProfile(payload);
  };

  const inviteLink = user?.invite_code
    ? `${process.env.NEXT_PUBLIC_APP_URL}/add?code=${user.invite_code}`
    : "";

  const copyToClipboard = () => {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink);
    addToast("Link copied to clipboard", "success");
  };

  // --- Download QR Logic ---
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
        ctx.fillStyle = "white"; // Add white background
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        const pngFile = canvas.toDataURL("image/png");

        const downloadLink = document.createElement("a");
        downloadLink.download = `paise-tag-${user?.name}.png`;
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

      {/* --- PROFILE --- */}
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

      {/* --- pAIse TAG (QR Code) --- */}
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
            {user?.invite_code ? (
              <>
                <QRCode
                  value={inviteLink}
                  size={160}
                  style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                />
                <div className="absolute inset-0 bg-black/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
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
            {user?.invite_code ? (
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
                  You haven't generated your unique pAIse Tag yet.
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

      {/* --- DANGER ZONE --- */}
      <div className="rounded-2xl border border-red-100 bg-red-50/30 p-8 shadow-sm">
        <h2 className="text-lg font-semibold text-red-600 mb-2">Danger Zone</h2>
        <p className="text-sm text-slate-500 mb-6">
          Deleting your account will remove all your data.
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
