"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/src/features/auth/store";
import { useRouter } from "next/navigation";

const decodeToken = (token: string) => {
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
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

export function AuthSync() {
  const { setAuth, user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    const getCookie = (name: string) => {
      if (typeof document === "undefined") return null;
      const match = document.cookie.match(
        new RegExp("(^| )" + name + "=([^;]+)")
      );
      return match ? match[2] : null;
    };

    const accessToken = getCookie("accessToken");

    if (!accessToken) return;

    const decoded = decodeToken(accessToken);

    if (decoded) {
      const isIdMatch = user?.id === decoded.userId;

      const isNameStale =
        user?.name === "User" && decoded.name && decoded.name !== "User";

      if (isIdMatch && !isNameStale) {
        return;
      }

      console.log("Syncing fresh data from token...");

      setAuth(
        {
          id: decoded.userId,
          email: decoded.email,
          name: decoded.name || "User",
          avatar: decoded.avatar,
          invite_code: decoded.inviteCode,
          currency: "INR",
          timezone: "Asia/Kolkata"
        },
        accessToken,
        ""
      );

      router.refresh();
    }
  }, [setAuth, user, router]);

  return null;
}
