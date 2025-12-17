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
    
    if (accessToken && (!user || !user?.name)) {
      const decoded = decodeToken(accessToken);
      console.log("41: ", decoded);
      
      if (decoded) {
        setAuth(
          {
            id: decoded.userId,
            email: decoded.email,
            name: decoded.name,
            avatar: decoded.avatar,
            invite_code: decoded.inviteCode,
            currency: "INR",
            timezone: "Asia/Kolkata",
          },
          accessToken,
          ""
        );
        router.refresh();
      }
    }
  }, [setAuth, user, router]);

  return null;
}
