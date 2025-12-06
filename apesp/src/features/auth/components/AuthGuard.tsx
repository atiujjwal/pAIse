"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/src/features/auth/store"; // Adjust import path if needed
import { api } from "@/src/lib/api"; // Adjust import path if needed
import { User, ApiResponse } from "@/src/types/api"; // Adjust import path if needed

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { accessToken, isAuthenticated, logout, updateUser } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  // FIXED: Whitelist public routes here
  // We allow '/auth/*' AND the root '/' (Landing Page) to be accessed without a token
  const isPublicRoute = pathname.startsWith("/auth") || pathname === "/";

  useEffect(() => {
    const verifySession = async () => {
      // If we are on a public route, we don't strictly need to force auth,
      // but we might want to fetch user data if a token exists (silent check).
      if (!accessToken) {
        setIsChecking(false);
        // Only redirect if trying to access a PROTECTED route
        if (!isPublicRoute) {
          router.push(`/auth/login?redirect=${encodeURIComponent(pathname)}`);
        }
        return;
      }

      try {
        // Verification: GET /api/users/me
        const { data } = await api.get<ApiResponse<{ user: User }>>(
          "api/users/me"
        );
        if (data.data?.user) {
          updateUser(data.data.user);
        }
      } catch (error) {
        console.error("Session verification failed", error);
        logout();
        // Only redirect to login if we were on a private page
        if (!isPublicRoute) {
          router.push("/auth/login");
        }
      } finally {
        setIsChecking(false);
      }
    };

    verifySession();
  }, [accessToken, router, pathname, logout, updateUser, isPublicRoute]);

  // If it's a public route, render immediately (don't show spinner)
  if (isPublicRoute) {
    return <>{children}</>;
  }

  if (isChecking) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Render protected children only if authenticated
  return isAuthenticated ? <>{children}</> : null;
}
