"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/src/lib/api";
import { useAuthStore } from "@/src/features/auth/store";
import { Loader2, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import Link from "next/link";
import { cn } from "@/src/lib/utils";

export default function AcceptFriendPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();
  const { isAuthenticated } = useAuthStore((state) => state);
  const [status, setStatus] = useState<"verifying" | "success" | "error">(
    "verifying"
  );
  const [message, setMessage] = useState("Verifying link...");
  const queryClient = useQueryClient();

  const { mutate: verifyToken } = useMutation({
    mutationFn: async (token: string) => {
      const { data } = await api.post("/friends/requests/accept-link", {
        token,
      });
      return data;
    },
    onSuccess: (data) => {
      setStatus("success");
      setMessage(data.message || "Friend request accepted!");
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      queryClient.invalidateQueries({ queryKey: ["friend-requests"] });
      // Redirect to friends list after short delay
      setTimeout(() => router.push("/dashboard/friends"), 2000);
    },
    onError: (err: any) => {
      setStatus("error");
      setMessage(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Invalid or expired link"
      );
    },
  });

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Missing token in URL.");
      return;
    }

    if (!isAuthenticated) {
      // --- DEEP LINK RETENTION ---
      // Redirect to login, but tell login page to come back here after success
      const currentUrl = encodeURIComponent(
        `/dashboard/friends/accept?token=${token}`
      );
      router.push(`/auth/login?callbackUrl=${currentUrl}`);
      return;
    }

    // If authenticated and token exists, verify it
    verifyToken(token);
  }, [token, isAuthenticated, router, verifyToken]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
      <div className="w-full max-w-md bg-card border border-border rounded-[2.5rem] p-10 shadow-xl shadow-primary/5 space-y-8 animate-in zoom-in-95 duration-300">
        {status === "verifying" && (
          <div className="flex flex-col items-center gap-6">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
              <div className="relative h-20 w-20 bg-background rounded-full flex items-center justify-center border-2 border-primary/20 shadow-inner">
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-foreground tracking-tight">
                Processing...
              </h2>
              <p className="text-muted-foreground mt-2 font-medium">
                {message}
              </p>
            </div>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center gap-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="h-20 w-20 bg-secondary/10 text-secondary rounded-full flex items-center justify-center border-2 border-secondary/20 shadow-sm">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-foreground">
                Success!
              </h2>
              <p className="text-muted-foreground mt-2">{message}</p>
            </div>
            <Button
              asChild
              className="w-full h-12 rounded-xl bg-secondary hover:bg-secondary/90 text-secondary-foreground shadow-lg shadow-secondary/20"
            >
              <Link href="/dashboard/friends">
                Go to Friends <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center gap-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="h-20 w-20 bg-destructive/10 text-destructive rounded-full flex items-center justify-center border-2 border-destructive/20 shadow-sm">
              <XCircle className="h-10 w-10" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-foreground">
                Link Invalid
              </h2>
              <p className="text-muted-foreground mt-2">{message}</p>
            </div>
            <Button
              variant="outline"
              asChild
              className="w-full h-12 rounded-xl border-border hover:bg-muted"
            >
              <Link href="/dashboard">Go Home</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
