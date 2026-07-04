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
  AlertCircle,
} from "lucide-react";
import QRCode from "react-qr-code";
import { useQuery } from "@tanstack/react-query";

import { api } from "@/src/lib/api";
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
  DialogDescription,
  DialogFooter,
} from "@/src/components/ui/Dialog";
import { Skeleton } from "@/src/components/ui/Skeleton";
import { cn } from "@/src/lib/utils";

const addFriendSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export function AddFriendCard() {
  const { user: storedUser } = useAuthStore((state) => state);
  const { sendRequest } = useFriendActions();
  const { addToast } = useToastStore();
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  const [isErrorOpen, setIsErrorOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ["user", "me"],
    queryFn: async () => {
      const { data } = await api.get("/users/me");
      return data.data;
    },
  });

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
        onSuccess: () => {
          reset();
          addToast("Request sent successfully", "success");
        },
        onError: (err: any) => {
          let displayMsg = err || "An unexpected error occurred.";
          try {
            if (err?.response?.data && typeof err.response.data === "object") {
              const apiData = err.response.data;
              if (apiData.error) displayMsg = apiData.error;
              else if (apiData.message) displayMsg = apiData.message;
            } else if (err?.message) {
              displayMsg = err.message;
            }
          } catch (e) {
            console.error("Error parsing API response:", e);
          }
          setErrorMessage(String(displayMsg));
          setIsErrorOpen(true);
        },
      }
    );
  };

  const inviteLink = activeUser?.invite_code
    ? `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/add?code=${activeUser.invite_code}`
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
    <>
      <div className="rounded-3xl border border-border bg-card p-6 md:p-8 shadow-sm sticky top-6">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-bold text-foreground">Add Friends</h3>

          {isLoadingProfile && !inviteLink ? (
            <Skeleton className="h-10 w-10 rounded-xl" />
          ) : inviteLink ? (
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl"
                  title="Show QR Code"
                >
                  <QrCode className="h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-xs rounded-3xl p-6 z-[100] border border-border bg-card shadow-2xl transition-all duration-200">
                <DialogHeader className="space-y-1 text-center">
                  <DialogTitle className="text-center text-lg font-extrabold tracking-tight text-foreground">
                    Your pAIse Tag
                  </DialogTitle>
                </DialogHeader>

                <div className="flex flex-col items-center justify-center space-y-4 pt-2">
                  {/* Premium QR Container */}
                  <div
                    ref={qrRef}
                    className="p-4 bg-white rounded-2xl shadow-lg shadow-primary/5 border border-primary/10 flex items-center justify-center"
                  >
                    <QRCode value={inviteLink} size={150} />
                  </div>

                  {/* Modern Solid Download Button */}
                  <Button
                    onClick={downloadQRCode}
                    className="w-full h-10 rounded-xl bg-gradient-to-r from-primary to-secondary text-white text-xs font-bold shadow-md shadow-primary/20 hover:shadow-lg transition-all hover:scale-[1.02]"
                  >
                    <Download className="h-4 w-4 mr-2" /> Download QR
                  </Button>

                  <p className="text-xs font-medium text-center text-muted-foreground">
                    Friends can scan this to add you instantly.
                  </p>
                </div>
              </DialogContent>
            </Dialog>
          ) : null}
        </div>

        <div className="space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <Label className="text-foreground font-semibold">
              Invite by Email
            </Label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Mail className="absolute left-3.5 top-3.5 h-5 w-5 text-muted-foreground" />
                <Input
                  {...register("email")}
                  placeholder="friend@example.com"
                  className="pl-11 h-12 rounded-xl bg-muted/30 border-border focus:bg-card"
                />
              </div>
              <Button
                type="submit"
                disabled={sendRequest.isPending}
                className="h-12 px-6 rounded-xl shadow-lg shadow-primary/20"
              >
                {sendRequest.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Send"
                )}
              </Button>
            </div>
            {errors.email && (
              <p className="text-xs text-destructive ml-1">
                {errors.email.message}
              </p>
            )}
          </form>
        </div>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase tracking-wider">
            <span className="bg-card px-3 text-muted-foreground font-medium">
              Or share link
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-foreground font-semibold">
            Your Invite Link
          </Label>

          {isLoadingProfile && !inviteLink ? (
            <Skeleton className="h-14 w-full rounded-2xl" />
          ) : (
            <div className="flex items-center gap-2 rounded-2xl border border-border bg-muted/30 p-2 pr-3 transition-colors hover:bg-muted/50">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-card shadow-sm border border-border">
                <LinkIcon className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0 px-2">
                <p className="truncate text-xs font-mono text-muted-foreground">
                  {inviteLink || "Generate a tag in Settings"}
                </p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={handleCopyLink}
                disabled={!inviteLink}
                className="h-9 w-9 hover:bg-card hover:shadow-sm rounded-lg"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-secondary" />
                ) : (
                  <Copy className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* --- ERROR ALERT DIALOG --- */}
      <Dialog open={isErrorOpen} onOpenChange={setIsErrorOpen}>
        <DialogContent className="sm:max-w-[400px] border-l-4 border-l-destructive rounded-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3 text-destructive mb-2">
              <AlertCircle className="h-6 w-6" />
              <DialogTitle className="text-xl font-bold text-foreground">
                Request Failed
              </DialogTitle>
            </div>
            <DialogDescription className="text-muted-foreground font-medium text-base pt-1">
              {errorMessage}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 sm:justify-end">
            <Button
              onClick={() => setIsErrorOpen(false)}
              className="bg-foreground text-background hover:bg-foreground/90 rounded-xl"
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
