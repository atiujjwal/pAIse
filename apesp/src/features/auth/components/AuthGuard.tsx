"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "../store";
import { ApiResponse } from "@/src/lib/response";
import { User } from "@/src/lib/types";
import { api } from "@/src/lib/api";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { accessToken, isAuthenticated, logout, updateUser } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const verifySession = async () => {
      if (!accessToken) {
        setIsChecking(false);
        // If not authenticated and trying to access protected route
        if (!pathname.startsWith("/auth")) {
          router.push(`/auth/login?redirect=${encodeURIComponent(pathname)}`);
        }
        return;
      }

      try {
        // [cite_start]; // Verification: GET /api/users/me [cite: 161]
        // This ensures the token is valid on the server side
        const { data } = await api.get<ApiResponse<{ user: User }>>(
          "api/users/me"
        );
        updateUser(data.data!.user);
      } catch (error) {
        // If verification fails (401), logout and redirect
        console.error("Session verification failed", error);
        logout();
        router.push("/auth/login");
      } finally {
        setIsChecking(false);
      }
    };

    verifySession();
  }, [accessToken, router, pathname, logout, updateUser]);

  // Public routes (auth pages) don't need the guard blocking them
  if (pathname.startsWith("/auth")) {
    return <>{children}</>;
  }

  if (isChecking) {
    // Return a loading skeleton or spinner here
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // If check finished and not authenticated, we already redirected.
  // Render children only if authenticated.
  return isAuthenticated ? <>{children}</> : null;
}
