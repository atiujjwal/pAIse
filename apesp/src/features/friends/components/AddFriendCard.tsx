"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Mail,
  Link as LinkIcon,
  Copy,
  Check,
  Loader2,
  QrCode,
  Download,
} from "lucide-react";
import QRCode from "react-qr-code";
import { useQuery } from "@tanstack/react-query"; // Added useQuery

import { api } from "@/src/lib/api"; // Added api
import { useAuthStore } from "@/src/features/auth/store";
import { useFriendActions } from "@/src/features/friends/api/friend-queries";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { Label } from "@/src/components/ui/label";
import { useToastStore } from "@/src/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/components/ui/Dialog";
import { Skeleton } from "@/src/components/ui/Skeleton"; // Added Skeleton

const addFriendSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export function AddFriendCard() {
  const { user: storedUser } = useAuthStore((state) => state);
  const { sendRequest } = useFriendActions();
  const { addToast } = useToastStore();
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  // 1. FETCH FRESH PROFILE DATA
  // This ensures we get the invite_code even if local storage is stale
  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ["user", "me"],
    queryFn: async () => {
      const { data } = await api.get("/users/me");
      return data.data;
    },
    placeholderData: storedUser, // Show cached data while fetching
  });

  // Use the freshest data available
  const activeUser = profile || storedUser;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<{ email: string }>({
    resolver: zodResolver(addFriendSchema),
  });

  const onSubmit = (data: { email: string }) => {
    sendRequest.mutate(
      { email: data.email },
      {
        onSuccess: () => reset(),
      }
    );
  };

  const inviteLink = activeUser?.invite_code
    ? `https://paise.app/add?code=${activeUser.invite_code}`
    : "";

  const handleCopyLink = () => {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    addToast("Link copied to clipboard", "success");
    setTimeout(() => setCopied(false), 2000);
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
        downloadLink.download = `paise-tag-${activeUser?.name || "user"}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      }
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sticky top-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-slate-900">Add Friends</h3>

        {/* QR Code Trigger */}
        {isLoadingProfile && !inviteLink ? (
          <Skeleton className="h-9 w-9 rounded-md" />
        ) : inviteLink ? (
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-slate-400 hover:text-primary hover:bg-primary/5"
                title="Show QR Code"
              >
                <QrCode className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader>
                <DialogTitle className="text-center">
                  Your pAIse Tag
                </DialogTitle>
              </DialogHeader>
              <div className="flex flex-col items-center justify-center p-6 space-y-6">
                <div
                  ref={qrRef}
                  className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm"
                >
                  <QRCode value={inviteLink} size={200} />
                </div>
                <Button
                  onClick={downloadQRCode}
                  variant="outline"
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" /> Download QR
                </Button>
                <p className="text-xs text-center text-slate-500">
                  Friends can scan this to add you instantly.
                </p>
              </div>
            </DialogContent>
          </Dialog>
        ) : null}
      </div>

      {/* Option 1: Email */}
      <div className="space-y-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <Label className="text-slate-600">Invite by Email</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                {...register("email")}
                placeholder="friend@example.com"
                className="pl-9 h-11 bg-slate-50 border-slate-200"
              />
            </div>
            <Button
              type="submit"
              disabled={sendRequest.isPending}
              className="h-11 shadow-md shadow-primary/20"
            >
              {sendRequest.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Send"
              )}
            </Button>
          </div>
          {errors.email && (
            <p className="text-xs text-red-500 ml-1">{errors.email.message}</p>
          )}
        </form>
      </div>

      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-slate-100" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-slate-400 font-medium">
            Or share link
          </span>
        </div>
      </div>

      {/* Option 2: Copy Link */}
      <div className="space-y-3">
        <Label className="text-slate-600">Your Invite Link</Label>

        {isLoadingProfile && !inviteLink ? (
          <Skeleton className="h-12 w-full rounded-xl" />
        ) : (
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1.5 pr-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white shadow-sm border border-slate-100">
              <LinkIcon className="h-4 w-4 text-slate-400" />
            </div>
            <div className="flex-1 min-w-0 px-2">
              <p className="truncate text-xs font-mono text-slate-500">
                {inviteLink || "Generate a tag in Settings"}
              </p>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={handleCopyLink}
              disabled={!inviteLink}
              className="h-8 w-8 hover:bg-white hover:shadow-sm"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4 text-slate-500" />
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
