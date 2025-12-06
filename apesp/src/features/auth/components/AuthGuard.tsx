"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/src/features/auth/store";
import { api } from "@/src/lib/api";
import { ApiResponse, User } from "@/src/types/api";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  // Get the hydration flag
  const { accessToken, isAuthenticated, logout, updateUser, _hasHydrated } =
    useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  const isPublicRoute = pathname.startsWith("/auth") || pathname === "/";

  useEffect(() => {
    if (!_hasHydrated) return;

    const verifySession = async () => {
      if (!accessToken) {
        setIsChecking(false);
        if (!isPublicRoute) {
          router.push(`/auth/login?redirect=${encodeURIComponent(pathname)}`);
        }
        return;
      }

      // If logged in (token exists)
      try {
        // We only call this if we haven't checked recently or to ensure validity
        const { data } = await api.get<ApiResponse<{ user: User }>>(
          "api/users/me"
        );
        if (data.data?.user) {
          updateUser(data.data.user);
        }
      } catch (error) {
        console.error("Session verification failed", error);
        logout();
        if (!isPublicRoute) {
          router.push("/auth/login");
        }
      } finally {
        setIsChecking(false);
      }
    };

    verifySession();
  }, [
    accessToken,
    _hasHydrated,
    isPublicRoute,
    router,
    pathname,
    logout,
    updateUser,
  ]);

  if ((!_hasHydrated || isChecking) && !isPublicRoute) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Render public routes immediately
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // Render protected children only if authenticated
  return isAuthenticated ? <>{children}</> : null;
}
