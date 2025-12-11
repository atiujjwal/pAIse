"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/src/lib/api";
import { useAuthStore } from "@/src/features/auth/store";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import Link from "next/link";

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
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
        {status === "verifying" && (
          <>
            <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
            <h2 className="text-xl font-bold text-slate-900">Processing...</h2>
            <p className="text-slate-500">{message}</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="h-12 w-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Success!</h2>
            <p className="text-slate-500">{message}</p>
            <Button asChild className="w-full">
              <Link href="/dashboard/friends">Go to Friends</Link>
            </Button>
          </>
        )}

        {status === "error" && (
          <>
            <div className="h-12 w-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <XCircle className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Link Invalid</h2>
            <p className="text-slate-500">{message}</p>
            <Button variant="outline" asChild className="w-full">
              <Link href="/dashboard">Go Home</Link>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
