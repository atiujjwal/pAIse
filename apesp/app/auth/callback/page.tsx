"use client";

import { useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/src/features/auth/store";
import { Loader2 } from "lucide-react";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((state: any) => state.setAuth || state.login);

  const processedRef = useRef(false);

  useEffect(() => {
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

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium animate-pulse">
          Authenticating...
        </p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center bg-background">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
