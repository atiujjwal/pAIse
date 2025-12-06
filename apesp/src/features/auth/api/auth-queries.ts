import { useMutation } from "@tanstack/react-query";
import { api } from "@/src/lib/api";
import { useAuthStore } from "@/src/features/auth/store";
import { LoginInput, RegisterInput } from "@/src/lib/schemas";
import { AuthResponse, ApiResponse } from "@/src/types/api";
import { useRouter, useSearchParams } from "next/navigation";

export const useLogin = () => {
  const setAuth = useAuthStore((state) => state.setAuth);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Capture the intended destination (Deep Linking)
  const redirectUrl = searchParams.get("redirect") || "/dashboard";

  return useMutation({
    mutationFn: async (credentials: LoginInput) => {
      const { data } = await api.post<ApiResponse<AuthResponse>>(
        "api/auth/login",
        credentials
      );
      return data.data!;
    },
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken, data.refreshToken);
      // Smart Redirect: Go back to where they came from
      router.push(redirectUrl);
    },
  });
};

export const useRegister = () => {
  const setAuth = useAuthStore((state) => state.setAuth);
  const router = useRouter();

  return useMutation({
    mutationFn: async (userData: RegisterInput) => {
      const { data } = await api.post<ApiResponse<AuthResponse>>(
        "/auth/register",
        userData
      );
      return data.data!;
    },
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken, data.refreshToken);
      router.push("/dashboard");
    },
  });
};

export const useLogout = () => {
  const { logout: clearStore, refreshToken } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: async () => {
      if (refreshToken) {
        await api.post("api/auth/logout", { refreshToken });
      }
    },
    onSettled: () => {
      clearStore();
      router.replace("/auth/login");
    },
  });
};
