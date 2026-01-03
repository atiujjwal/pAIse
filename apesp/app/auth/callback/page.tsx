"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/src/features/auth/store";
import { Loader2 } from "lucide-react";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((state: any) => state.setAuth || state.login);

  const [mounted, setMounted] = useState(false);
  const processedRef = useRef(false);

  useEffect(() => {
    setMounted(true);
    const token = searchParams.get("token");

    if (!token) {
      if (!processedRef.current) {
        router.push("/auth/login?error=no_token");
      }
      return;
    }

    if (processedRef.current) return;
    processedRef.current = true;

    const processLogin = async () => {
      try {
        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
          window
            .atob(base64)
            .split("")
            .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
            .join("")
        );

        const payload = JSON.parse(jsonPayload);

        const user = {
          id: payload.userId,
          name: payload.name,
          email: payload.email,
          avatar: payload.avatar,
          invite_code: payload.inviteCode,
        };

        setAuth({
          user,
          accessToken: token,
          isAuthenticated: true,
        });

        window.location.href = "/dashboard";
      } catch (error) {
        console.error("Failed to process Google Login:", error);
        router.push("/auth/login?error=processing_failed");
      }
    };

    processLogin();
  }, [searchParams, router, setAuth]);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex h-screen w-screen items-center justify-center bg-background transition-opacity duration-500">
      <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-300">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg text-muted-foreground font-medium animate-pulse">
          Finalizing...
        </p>
      </div>
    </div>,
    document.body
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={null}>
      <AuthCallbackContent />
    </Suspense>
  );
}
